/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import menuIcon from '../assets/menuicon.png'
import { Link } from 'react-router-dom'
import Cart from './Cart'
import { useAuth } from '../Contexts/authContext'
import { Item } from '../interfaces/iteminterface'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Error from '../Loading/Error'
const apiUrl = import.meta.env.VITE_API_URL;

interface DrawerProps {
    drawerRef?: RefObject<HTMLDivElement | null>
}
export default function Drawer({ drawerRef }: DrawerProps) {
    const { user } = useAuth()
    const [viewAccount, setViewAccount] = useState(false)
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null);

    const handleResize = () => {
        setIsDesktop(window.innerWidth >= 768)
    }

    const handleDrawer = () => {
        if (isDesktop && isOpen) return
        setIsOpen((open) => !open)
    }

    const handleClickOutsideSearch = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setSearch(false);
        }
    }

    useEffect(() => {
        if (search) {
            // Save the current overflow style to restore it later
            const originalStyle = document.body.style.overflow;

            // Apply blur to everything except the navbar
            document.body.classList.add('blur-background');

            return () => {
                // Clean up when component unmounts or search becomes false
                document.body.classList.remove('blur-background');
                document.body.style.overflow = originalStyle;
            };
        }
    }, [search]);

    useEffect(() => {
        // on desktop set navbar open on mount
        if (window.innerWidth >= 768) {
            setIsOpen(true)
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('mousedown', handleClickOutsideSearch)
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousedown", handleClickOutsideSearch);
        };
    }, [])

    return <div ref={drawerRef} className={isOpen ? "flex flex-row w-fit md:w-full h-fit  bg-backgroundColor shadow-pink-300 shadow-sm items-center fixed top-0 left-0 md:static z-50" : "flex flex-row w-full h-fit items-center fixed top-0 left-0 md:static z-50"}>
        <div className={isDesktop ? "flex flex-col md:flex-row w-full h-full my-1" : "flex flex-col md:flex-row w-fit h-fit fixed top-0 bg-backgroundColor shadow-black shadow-md"}>
            <div className={isOpen ? "flex flex-row cursor-pointer w-fit items-center pr-2 md:pr-0 " : "cursor-pointer w-full h-full "}>
                {<img src={menuIcon} onClick={handleDrawer} className="w-8 h-8 "></img>}
                {(isOpen && !isDesktop) && <SearchBar search={search} setSearch={setSearch} reference={searchRef} />}
            </div>
            {isOpen && <div className="flex flex-col md:flex-row md:items-center space-x-4 pr-2 md:pr-0 pb-2 md:pb-0 ml-2 md:ml-3 md:w-full font-button">
                <Link to="/" className="hover:text-blue-500 transition-colors duration-300">Home</Link>
                <Link to="/shop" className="hover:text-blue-500 transition-colors duration-300">Shop</Link>
                <Link to="/about" className="hover:text-blue-500 transition-colors duration-300">About</Link>
                {isDesktop && <SearchBar search={search} setSearch={setSearch} reference={searchRef} />}
                <div className="flex flex-col md:flex-row md:ml-auto self-start md:self-auto md:mr-6 md:space-x-6">
                    {user?.role === 'admin' && <Link to="/inventory" className="hover:text-blue-500 transition-colors duration-300">Inventory</Link>}
                    {user ?
                        viewAccount ? <Account setViewAccount={setViewAccount} /> :
                            <button onClick={() => setViewAccount((view) => !view)} className="cursor-pointer hover:text-blue-500 transition-colors duration-300 w-fit md:w-auto">Account</button>
                        :
                        <Link to="/login" className="hover:text-blue-500 transition-colors duration-300">Login</Link>}
                    <Cart />
                </div>
            </div>}
        </div>
    </div>
}

interface AccountProps {
    setViewAccount: React.Dispatch<React.SetStateAction<boolean>>
}

function Account({ setViewAccount }: AccountProps) {
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
    }

    return <div className="relative w-full">
        <div className="absolute top-0 left-0 md:left-auto md:right-0 z-10 bg-white shadow-gray-500 shadow-sm rounded-lg">
            <div className="flex flex-col p-2">
                <button onClick={() => setViewAccount((view) => !view)} className="self-start md:self-end mr-2 cursor-pointer hover:text-blue-500 transition-colors duration-300">Account</button>
                <div className="flex flex-row space-x-2 md:space-x-6">
                    <button onClick={handleLogout} className="cursor-pointer hover:text-blue-500 transition-colors duration-300">Logout</button>
                </div>
            </div>
        </div>
    </div>
}

interface SearchBarProps {
    search: boolean,
    setSearch: React.Dispatch<React.SetStateAction<boolean>>
    reference: React.RefObject<HTMLDivElement | null>
}

function SearchBar({ search, setSearch, reference }: SearchBarProps) {
    const [query, setQuery] = useState('')
    const [items, setItems] = useState<Item[]>([])
    const [height, setHeight] = useState(search ? 'auto' : '0')
    const [opacity, setOpacity] = useState(search ? 100 : 0)
    const [overflow, setOverflow] = useState('hidden')

    const { isFetching, error, isError, data: inventoryData = [] } = useQuery<Item[], Error>({
        queryKey: ['inventory'],
        queryFn: async () => {
            const res = await axios.get<Item[]>(`${apiUrl}/inventory`)
            return res.data
        },
        staleTime: 60 * 1000,
        gcTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    })

    useEffect(() => {
        if (isFetching) return
        setItems(inventoryData.slice(0, 4))
    }, [inventoryData])

    useEffect(() => {
        if (search) {
            setHeight('auto')
            setOpacity(100)

            const timer = setTimeout(() => {
                setOverflow('visible')
            }, 400)

            return () => clearTimeout(timer)
        } else {
            setHeight('0')
            setOpacity(0)
            setOverflow('hidden')
        }
    }, [search])

    const useDebounce = (fn: any, delay: number) => {
        const timerRef = useRef<NodeJS.Timeout | null>(null);

        return useCallback((...args: Parameters<any>) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                fn(...args);
            }, delay);
        }, [fn, delay]);
    };

    const handleSearch = useCallback((searchTerm: string) => {
        setItems(() => {
            if (searchTerm.length === 0) return inventoryData.slice(0, 4);

            const lowerQuery = searchTerm.toLowerCase();

            // Prioritize items that start with the query
            const startsWithResults = inventoryData.filter((item) =>
                item.name.toLowerCase().startsWith(lowerQuery)
            );

            // If no results, fall back to includes()
            if (startsWithResults.length > 0) {
                return startsWithResults.slice(0, 4);
            }

            return inventoryData
                .filter((item) => item.name.toLowerCase().includes(lowerQuery))
                .slice(0, 4);
        });
    }, [inventoryData])

    const debounceSearch = useDebounce(handleSearch, 600)

    const handleSearchChange = (searchTerm: string) => {
        // Update the search input immediately
        setQuery(searchTerm);
        debounceSearch(searchTerm)
    };


    return <div className="flex w-full justify-center">
        <div className="flex flex-col items-center" ref={reference}>
            <div className="flex flex-row items-center relative">
                <input
                    type="text"
                    placeholder="Search"
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setSearch(true)}
                    className="px-2.5 py-1.5 w-full rounded-full bg-white border shadow-black  border-gray-200  hover:border-pink-300 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 transition-all duration-200 shadow-sm text-gray-800 placeholder-gray-400"
                />
                <button className="absolute right-3 text-gray-400 hover:text-pink-500 ">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>

            {isError ? <Error message={error ? `${error}` : 'Error loading items'} /> : <div
                className={`w-[140%] relative z-10 ml-6 md:ml-0 transform-gpu overflow-${overflow} transition-all duration-400 ease-in-out`}
                style={{
                    height: height,
                    opacity: opacity / 100
                }}
            >

                {(search && items.length > 0) &&
                    <div className="flex flex-col w-full border-black border-1 rounded-lg absolute h-fit right-0 my-2">
                        {items.map((item, index) => {
                            return <DisplayItem key={item.name} item={item} isFirst={index === 0} isLast={index === items.length - 1} />
                        })}
                    </div>}
            </div>}
        </div>
    </div>
}

interface DisplayItemProps {
    item: Item,
    isFirst: boolean,
    isLast: boolean
}

function DisplayItem({ item, isFirst, isLast }: DisplayItemProps) {

    const handleNav = () => {
        window.location.href = `/shop/item/${item.name}`
    }

    return <div className={`relative flex flex-row h-fit bg-white p-1.5 cursor-pointer
        ${isFirst ? 'rounded-t-lg' : ''}
        ${isLast ? 'rounded-b-lg' : ''}
    `} onClick={handleNav}>
        <div className="w-14 h-full justify-center">
            <img src={item.photos[0]?.photo ?? ''} alt={item.photos[0]?.tag ?? ''} className="w-auto h-max object-contain"></img>
        </div>
        <div className="flex flex-col h-full ml-2">
            <p>{item.name}</p>
            <p>${Number(item.price).toFixed(2) || 0}</p>
        </div>
    </div>
}