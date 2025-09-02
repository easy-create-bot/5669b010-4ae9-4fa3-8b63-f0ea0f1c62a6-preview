import React, { FormEvent, useEffect, useState } from "react";
import Drawer from "../Navbar/Drawer";
import uploadPhotoICON from '../assets/uploadPhotoICON.png'
import { Item } from "../interfaces/iteminterface";
import axios, { AxiosError } from 'axios'
import FormData from "form-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Orders from "./Orders";
import Loading from "../Loading/Loading";
import Error from "../Loading/Error";
import { useAuth } from "../Contexts/authContext";
const apiUrl = import.meta.env.VITE_API_URL;

export default function Inventory() {
    return (
        <div className="h-screen">
            <Drawer />
            <Dashboard />
        </div>
    )
}

interface DashboardOptionProps {
    option: string
}

function DashboardOption({ option }: DashboardOptionProps) {
    if (option === 'inventory') {
        return <DisplayInventory />
    } else if (option === 'orders') {
        return <Orders />
    } return null
}


function Dashboard() {
    const [dashboardOption, setDashboardOption] = useState('inventory')

    return <div className="flex flex-col border-2 border-black my-4 w-[95%] mx-auto">
        <DashboardNavbar setDashboardOption={setDashboardOption} />
        <DashboardOption option={dashboardOption} />
    </div>
}

interface DashboardNavbarProps {
    setDashboardOption: React.Dispatch<React.SetStateAction<string>>
}

function DashboardNavbar({ setDashboardOption }: DashboardNavbarProps) {
    return <div className="flex flex-row h-fit p-2 w-full border-black border-b-2 items-center pl-4 space-x-6 font-button">
        <button className="cursor-pointer hover:text-blue-500 transition-colors duration-300" onClick={() => setDashboardOption('inventory')}>Inventory</button>
        <button className="cursor-pointer hover:text-blue-500 transition-colors duration-300" onClick={() => setDashboardOption('orders')}>Orders</button>
    </div>
}

function DisplayInventory() {
    const { isFetching, error, data: inventoryData = [] } = useQuery<Item[], Error>({
        queryKey: ['inventory'],
        queryFn: async () => {
            const res = await axios.get<Item[]>(`${apiUrl}/inventory`)
            return res.data
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchInterval: 2 * 60 * 1000
    })
    const [items, setItems] = useState<Item[]>([])
    const [addItem, setAddItem] = useState(false)
    const [currentCategories, setCurrentCategories] = useState<Set<string>>(new Set())
    const [filterCategory, setFilterCategory] = useState<string>('All')

    useEffect(() => {
        const newCategories = new Set<string>()
        inventoryData.forEach((item) => {
            if (typeof item.category === "string") {
                if (!newCategories.has(item.category)) {
                    newCategories.add(item.category)
                }
            } else {
                item.category.forEach((category) => {
                    if (!newCategories.has(category)) {
                        newCategories.add(category)
                    }
                })
            }
        })
        setCurrentCategories(newCategories)
    }, [inventoryData])

    useEffect(() => {
        if (filterCategory === "All") {
            setItems(inventoryData)
            return
        }
        setItems(inventoryData.filter((item) => item.category.includes(filterCategory)))
    }, [filterCategory, inventoryData])

    if (error) { return <Error message={error.message} /> }

    return <div className="flex flex-col w-[95%] md:w-[90%] h-fit mx-auto md:my-2">
        <div className="flex flex-row flex-wrap w-full">
            <div>
                <h3 className="text-2xl font-headerFont">Current Inventory</h3>
                <button className="self-end border-black border-2 px-2 py-1 rounded-full font-button cursor-pointer" onClick={() => setAddItem((add) => !add)}>{addItem ? 'Go Back' : 'Add to inventory'}</button>
            </div>
            <div className="flex flex-row items-center ml-auto space-x-1">
                <p className="text-xl">Category: </p>
                <select className="border-black border-2 p-0.5 rounded-lg font-button" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {[...currentCategories].map((category) => {
                        return <option key={category} value={category}>{category}</option>
                    })}
                    <option>All</option>
                </select>
            </div>
        </div>
        {addItem && <AddItem categories={currentCategories} />}
        {isFetching ? <div className="flex flex-col w-full items-center justify-center p-12 space-y-1.5">
            <p className="font-regular font-bold text-xl">Loading Shop Items</p>
            <Loading />
        </div> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto max-h-120 border-black border-2 my-2 shadow-gray-400 shadow-lg">
                {items?.map((item: Item, index) => {
                    return <DisplayItem key={index} item={item} />
                })}
            </div>
        }
    </div>
}

interface DeleteMutationProps {
    itemName: string
}

interface DisplayItemProps {
    item: Item
}

function DisplayItem({ item }: DisplayItemProps) {
    const { accessToken } = useAuth();
    const queryClient = useQueryClient();
    const [modify, setModify] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: async ({ itemName }: DeleteMutationProps) => {
            await axios.delete(`${apiUrl}/inventory/item/${itemName}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['inventory'] });
            await queryClient.invalidateQueries({ queryKey: ['inventory', item.category] });
            await queryClient.invalidateQueries({ queryKey: [item.name] });

            await queryClient.refetchQueries({ queryKey: ['inventory'] });
            await queryClient.refetchQueries({ queryKey: ['inventory', item.category] });
            await queryClient.refetchQueries({ queryKey: [item.name] });
        }
    });

    const handleItemDelete = () => {
        deleteMutation.mutate({ itemName: item.name });
    };

    return (
        <div className={modify ? "flex flex-col h-120 overflow-y-auto  items-center border-black border-2 pb-1" : "flex flex-col h-120 overflow-y-auto items-center border-black border-2 pb-1 py-6"}>
            <div className={modify ? "flex flex-col w-fit px-4  my-2 font-regular" : "px-4 flex flex-col w-fit justify-center font-regular"}>
                {modify ? (
                    <ModifyItem item={item} />
                ) : (
                    <>
                        <img src={item?.photos?.[0]?.photo ?? ''} alt={item?.photos?.[0]?.tag ?? ''} className="w-full h-[250px] object-contain" />
                        <div className="md:text-lg">
                            <p>Name: {item.name}</p>
                            {item.isBundle ? (
                                <div>
                                    <p>Bundle Prices:</p>
                                    <ul>
                                        {item.priceOptions && Object.entries(item.priceOptions)?.map(([bundle, price]) => (
                                            <li key={bundle}>{bundle} – ${Number(price).toFixed(2)}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p>Price: ${Number(item.price).toFixed(2)}</p>
                            )}
                            <p>Quantity: {item.quantity}</p>
                            <p>Categories: {item.category.length > 1 ? `${item.category.join(", ").slice(0, 10)}...` : `${item.category[0]}`}</p>
                            <p>Description: {item.description.slice(0, 10)}...</p>
                            <div className="grid grid-cols-1">
                                {Object.keys(item.options).map((option) => (
                                    <label key={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                        <div>
                                            {item.options[option].map((value) => (
                                                <p key={value} className="ml-1">-{value}</p>
                                            ))}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                <div className="flex flex-row justify-between w-full">
                    <button
                        className="bg-actionColor text-white p-1 rounded-md font-bold font-button cursor-pointer text-lg transition delay-100 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 my-2"
                        onClick={() => setModify((modify) => !modify)}
                    >
                        {modify ? 'Return' : 'Modify'}
                    </button>
                    <button
                        className="bg-actionColor text-white p-1 rounded-md font-bold font-button cursor-pointer text-lg transition delay-100 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 my-2"
                        onClick={handleItemDelete}
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

interface Photo {
    photo: string,
    tag?: string
}

function ModifyItem({ item }: DisplayItemProps) {
    const queryClient = useQueryClient();
    const { accessToken } = useAuth();
    const [photos, setPhotos] = useState<Photo[]>(() => {
        // Start with existing photos and add one empty slot for new uploads
        const initialPhotos = [...item.photos];
        initialPhotos.push({ photo: '', tag: '' }); // Always have one empty slot available
        return initialPhotos;
    });
    const [modifiedItem, setModifiedItem] = useState<Item>(item);

    const handlePhotoChange = (index: number, photo: Photo) => {
        setPhotos(prevPhotos => {
            const newPhotos = [...prevPhotos];
            newPhotos[index] = photo;

            // Add a new empty slot if this was the last empty slot
            const hasEmptySlot = newPhotos.some(p => !p.photo || p.photo.length === 0);
            if (!hasEmptySlot) {
                newPhotos.push({ photo: '', tag: '' });
            }

            return newPhotos;
        });
    };

    const handlePhotoRemove = (index: number) => {
        setPhotos(prevPhotos => {
            const newPhotos = [...prevPhotos];

            if (newPhotos.length === 1) {
                // If only one photo, just clear it instead of removing
                newPhotos[index] = { photo: '', tag: '' };
            } else {
                // Remove the photo at the specified index
                newPhotos.splice(index, 1);
            }

            // Ensure there's always at least one empty slot for new uploads
            const hasEmptySlot = newPhotos.some(p => !p.photo || p.photo.length === 0);
            if (!hasEmptySlot) {
                newPhotos.push({ photo: '', tag: '' });
            }

            return newPhotos;
        });
    };

    const handleItemChange = (property: keyof Item, value: string | Photo[] | number) => {
        if (property === 'category' && typeof value === 'string') {
            const categories = value.split(',');
            setModifiedItem({
                ...modifiedItem,
                [property]: categories
            });
            return;
        }
        setModifiedItem({
            ...modifiedItem,
            [property]: value
        });
    };

    useEffect(() => {
        // Filter out empty photos before updating the item
        const nonEmptyPhotos = photos.filter(photo => photo.photo && photo.photo.length > 0);
        handleItemChange('photos', nonEmptyPhotos);
    }, [photos]);

    const updateMutation = useMutation({
        mutationFn: async (updatedItem: Item) => {
            const response = await axios.put(`${apiUrl}/inventory/item/${item.name}`, {
                item: updatedItem,
                oldCategories: item.category
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['inventory'] });
            await queryClient.invalidateQueries({ queryKey: ['inventory', item.category] });
            await queryClient.invalidateQueries({ queryKey: [item.name] });

            await queryClient.refetchQueries({ queryKey: ['inventory'] });
            await queryClient.refetchQueries({ queryKey: ['inventory', item.category] });
            await queryClient.refetchQueries({ queryKey: [item.name] });
        }
    });

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateMutation.mutate(modifiedItem);
    };

    return (
        <div className="my-4 bg-white rounded-lg">
            <form className="space-y-6" onSubmit={onSubmit}>
                <div>
                    <label htmlFor="name" className="block text-sm text-gray-800 font-semibold">Item Name</label>
                    <input
                        type="text"
                        id="name"
                        className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={modifiedItem.name}
                        onChange={(event) => handleItemChange('name', event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm text-gray-800 font-semibold">Item Price</label>
                    <input
                        type="text"
                        id="price"
                        className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={modifiedItem.price}
                        onChange={(event) => handleItemChange('price', event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="quantity" className="block text-sm text-gray-800 font-semibold">Quantity</label>
                    <input
                        type="text"
                        id="quantity"
                        className="w-32 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={modifiedItem.quantity}
                        onChange={(event) => handleItemChange('quantity', event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm text-gray-800 font-semibold">Category</label>
                    <input
                        type="text"
                        id="category"
                        className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={modifiedItem.category}
                        onChange={(event) => handleItemChange('category', event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="options" className="block text-sm text-gray-800 font-semibold">Options</label>
                    <DisplayOptions item={modifiedItem} setItem={setModifiedItem} />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm text-gray-800 font-semibold">Description</label>
                    <textarea
                        id="description"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-40 resize-none"
                        value={modifiedItem.description}
                        onChange={(event) => handleItemChange('description', event.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center justify-center gap-4">
                    {photos.map((photo, index) => (
                        <PhotoUpload
                            key={index}
                            photo={photo}
                            index={index}
                            onPhotoChange={handlePhotoChange}
                            onPhotoRemove={handlePhotoRemove}
                        />
                    ))}
                </div>

                <div>
                    <label className="block text-sm text-gray-800 font-semibold">Bundle Options</label>
                    <AddBundle setItem={setModifiedItem} initialBundles={item.isBundle ? item.priceOptions : {}} />
                </div>

                <button
                    type="submit"
                    className="w-full bg-actionColor text-white py-2 px-4 rounded-md hover:bg-pink-400 cursor-pointer focus:outline-none focus:ring-2 transition-colors font-medium"
                >
                    Submit Changes
                </button>
            </form>
        </div>
    );
}

interface ItemMutationProps {
    item: Item
}

interface AddItemProps {
    categories: Set<string>
}

interface Photo {
    photo: string,
    tag?: string
}

function AddItem({ categories }: AddItemProps) {
    const [photos, setPhotos] = useState<Photo[]>([
        { photo: '', tag: '' } // Start with just one empty slot
    ]);
    const queryClient = useQueryClient();
    const { accessToken } = useAuth();
    const [item, setItem] = useState<Item>({
        name: "",
        price: 0,
        category: [],
        options: {},
        quantity: 0,
        description: "",
        photos: [],
        priceOptions: {},
        isBundle: false,
        reviews: []
    });

    const handlePhotoChange = (index: number, photo: Photo) => {
        setPhotos(prevPhotos => {
            const newPhotos = [...prevPhotos];
            newPhotos[index] = photo;

            // Add a new empty slot if this was the last empty slot
            const hasEmptySlot = newPhotos.some(p => !p.photo || p.photo.length === 0);
            if (!hasEmptySlot) {
                newPhotos.push({ photo: '', tag: '' });
            }

            return newPhotos;
        });
    };

    const handlePhotoRemove = (index: number) => {
        setPhotos(prevPhotos => {
            const newPhotos = [...prevPhotos];

            if (newPhotos.length === 1) {
                // If only one photo, just clear it instead of removing
                newPhotos[index] = { photo: '', tag: '' };
            } else {
                // Remove the photo at the specified index
                newPhotos.splice(index, 1);
            }

            // Ensure there's always at least one empty slot for new uploads
            const hasEmptySlot = newPhotos.some(p => !p.photo || p.photo.length === 0);
            if (!hasEmptySlot) {
                newPhotos.push({ photo: '', tag: '' });
            }

            return newPhotos;
        });
    };

    useEffect(() => {
        const nonEmptyPhotos = photos.filter(photo => photo.photo && photo.photo.length > 0);
        setItem(prevItem => ({
            ...prevItem,
            photos: nonEmptyPhotos
        }));
    }, [photos]);

    const itemMutate = useMutation({
        mutationFn: async ({ item }: ItemMutationProps) => {
            await axios.post(`${apiUrl}/inventory/item`, { item: item }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            // Reset form
            setItem({
                name: "",
                price: 0,
                category: [],
                options: {},
                quantity: 0,
                description: "",
                photos: [],
                priceOptions: {},
                isBundle: false,
                reviews: []
            });

            // Reset photos to just one empty slot
            setPhotos([{ photo: '', tag: '' }]);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['inventory'] });
            await queryClient.invalidateQueries({ queryKey: ['inventory', item.category] });
            await queryClient.invalidateQueries({ queryKey: [item.name] });

            await queryClient.refetchQueries({ queryKey: ['inventory'] });
            await queryClient.refetchQueries({ queryKey: ['inventory', item.category] });
            await queryClient.refetchQueries({ queryKey: [item.name] });
        }
    });

    const handleAddItem = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        itemMutate.mutate({ item: item });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>, field: keyof Item) => {
        if (field === 'category' && typeof e.target.value === 'string') {
            const categories = e.target.value.split(',');
            setItem((prevItem) => ({
                ...prevItem,
                [field]: categories
            }));
            return;
        }
        const value = e.target.value;
        setItem((prevItem) => ({
            ...prevItem,
            [field]: value,
        }));
    };

    return (
        <div className="w-full p-2 p-r-0 my-2 font-regular md:text-lg">
            <form onSubmit={handleAddItem}>
                <div className="flex flex-col w-full">
                    <div className="flex flex-col md:flex-row md:space-x-4">
                        <div className="flex flex-col w-full md:w-1/2">
                            <p>Item Name</p>
                            <input
                                type="text"
                                className="md:py-0.5 border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors border-2 pl-1 ml-2"
                                value={item.name}
                                onChange={(event) => handleInputChange(event, "name")}
                            />
                            <p>Item Price</p>
                            <input
                                type="text"
                                className="md:py-0.5 border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors border-2 pl-1 ml-2"
                                value={item.price}
                                onChange={(event) => handleInputChange(event, "price")}
                            />
                            <p>Category</p>
                            <input
                                type="text"
                                className="md:py-0.5 border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors border-2 pl-1 ml-2"
                                value={item.category}
                                onChange={(event) => handleInputChange(event, "category")}
                            />
                            <p>Quantity</p>
                            <input
                                type="text"
                                className="md:py-0.5 border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors border-2 pl-1 ml-2"
                                value={item.quantity}
                                onChange={(event) => handleInputChange(event, "quantity")}
                            />
                            <p>Description</p>
                            <textarea
                                className="resize-none border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors border-2 pl-1 h-fit ml-2"
                                value={item.description}
                                onChange={(event) => handleInputChange(event, "description")}
                            />
                        </div>
                        <div className="flex flex-col my-4 md:my-auto ml-2 md:mx-auto space-y-4">
                            <DisplayCategories categories={categories} />
                            <DisplayOptions item={item} setItem={setItem} />
                            <AddBundle setItem={setItem} />
                        </div>
                    </div>
                    <div className="flex flex-col mx-auto w-fit my-2">
                        <h3 className="text-2xl font-headerFont">Photos</h3>
                        <div className="grid grid-cols-3 gap-8 p-4 py-2">
                            {photos.map((photo, index) => (
                                <div key={index}>
                                    <PhotoUpload
                                        photo={photo}
                                        index={index}
                                        onPhotoChange={handlePhotoChange}
                                        onPhotoRemove={handlePhotoRemove}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        className="border-black border-1 w-fit self-center px-4 py-2 rounded-full text-lg hover:border-blue-400 duration-300 transition-colors font-bold font-button"
                        type="submit"
                    >
                        Add Item to inventory
                    </button>
                </div>
            </form>
        </div>
    );
}

interface AddBundleProps {
    setItem: React.Dispatch<React.SetStateAction<Item>>
    initialBundles?: Record<string, number>
}

function AddBundle({ setItem, initialBundles = {} }: AddBundleProps) {
    const [createBundle, setCreateBundle] = useState<boolean>(Object.keys(initialBundles).length > 0);

    return (
        <div>
            <label className="flex flex-col items-start">
                Bundle?
                <input type="checkbox" checked={createBundle} onChange={() => setCreateBundle(bundle => !bundle)} />
            </label>
            {createBundle && <DisplayBundles setItem={setItem} initialBundles={initialBundles} />}
        </div>
    );
}
interface DisplayBundlesProps {
    setItem: React.Dispatch<React.SetStateAction<Item>>;
    initialBundles?: Record<string, number>;
}

function DisplayBundles({ setItem, initialBundles = {} }: DisplayBundlesProps) {
    const [bundles, setBundles] = useState<Record<string, number>>(initialBundles);
    const [currBundle, setCurrBundle] = useState<string>("");
    const [selectedBundle, setSelectedBundle] = useState<string>("");
    const [bundlePriceInput, setBundlePriceInput] = useState<string>("");
    const [priceLocked, setPriceLocked] = useState<boolean>(false);

    useEffect(() => {
        setItem(prev => ({
            ...prev,
            isBundle: true,
            priceOptions: bundles
        }));
    }, [bundles]);

    useEffect(() => {
        if (selectedBundle && bundles[selectedBundle] !== undefined) {
            const price = bundles[selectedBundle];
            setBundlePriceInput(price === 0 ? "" : price.toString());
            setPriceLocked(price !== 0);
        }
    }, [selectedBundle, bundles]);

    const handleAddBundle = () => {
        if (currBundle.trim() === "") return;
        setBundles(prev => ({ ...prev, [currBundle]: 0 }));
        setSelectedBundle(currBundle);
        setCurrBundle("");
        setBundlePriceInput("");
        setPriceLocked(false);
    };

    const handleSetPrice = () => {
        const parsed = parseFloat(bundlePriceInput);
        if (isNaN(parsed)) return;
        setBundles(prev => ({ ...prev, [selectedBundle]: parsed }));
        setPriceLocked(true);
    };

    const handleRemovePrice = () => {
        setBundles(prev => ({ ...prev, [selectedBundle]: 0 }));
        setBundlePriceInput("");
        setPriceLocked(false);
    };

    return (
        <div className="flex flex-col w-fit">
            <p className="w-fit border-gray-800 border-3 border-b-0 px-2 rounded-tr-2xl rounded-tl-2xl">Bundles</p>
            <div className="border-gray-800 border-3 p-2 rounded-bl-lg rounded-br-lg rounded-tr-lg">
                <p>Enter Quantity of item for bundle:</p>
                <div className="flex flex-row flex-wrap gap-2">
                    <input
                        type="text"
                        className="pl-1 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors"
                        value={currBundle}
                        onChange={(e) => setCurrBundle(e.target.value)}
                    />
                    <button
                        className="border-black border-1 px-3 rounded-full cursor-pointer"
                        type="button"
                        onClick={handleAddBundle}
                    >
                        Add
                    </button>
                </div>

                <div className="grid grid-cols-2 my-2 min-h-8 items-center p-1 gap-1">
                    {Object.keys(bundles).map((key) => (
                        <div key={key}>
                            <Bundle
                                setBundles={setBundles}
                                currBundle={key}
                                setSelectedBundle={setSelectedBundle}
                            />
                        </div>
                    ))}
                </div>

                {selectedBundle && (
                    <div className="mt-2 flex flex-col gap-2">
                        <p>Enter price for <strong>{selectedBundle}</strong> items:</p>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                className="w-fit border-2 border-black pl-1 rounded-md"
                                value={bundlePriceInput}
                                onChange={(e) => setBundlePriceInput(e.target.value)}
                                placeholder="Enter price"
                                readOnly={priceLocked}
                            />
                            {!priceLocked ? (
                                <button
                                    type="button"
                                    className="border-black border-1 px-3 rounded-full cursor-pointer"
                                    onClick={handleSetPrice}
                                >
                                    Add
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="text-red-500 font-bold px-3 rounded-full cursor-pointer"
                                    onClick={handleRemovePrice}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



interface BundleProps {

    setBundles: React.Dispatch<React.SetStateAction<Record<string, number>>>
    currBundle: string
    setSelectedBundle: React.Dispatch<React.SetStateAction<string>>
}
function Bundle({ setBundles, currBundle, setSelectedBundle }: BundleProps) {

    const removeFromBundle = () => {
        setBundles(prev => {
            const updated = { ...prev };
            delete updated[currBundle];

            if (Object.keys(updated).length > 0) {
                const resetSelectedOpt = Object.keys(updated)[0] || ""
                setSelectedBundle(resetSelectedOpt)
            } else {
                setSelectedBundle("")
            }
            return updated;
        });
    };

    return <div className="cursor-pointer border-2 border-gray-400 text-center w-fit px-2 space-x-1 rounded-full transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
        <button type="button" className="cursor-pointer" onClick={() => setSelectedBundle(currBundle)}>{currBundle}</button>
        <button className="self-end font-md cursor-pointer" type="button" onClick={removeFromBundle}>-</button>
    </div>
}

interface DisplayCategoriesProps {
    categories: Set<string>
}

function DisplayCategories({ categories }: DisplayCategoriesProps) {

    return <div className="flex flex-col w-fit">
        <p className="border-gray-800 border-3 border-b-0 shadow-gray-400 shadow-sm w-fit px-2 rounded-tr-2xl rounded-tl-2xl">Categories</p>
        {(categories && categories.size > 0) ? <div className="border-gray-800 border-3 rounded-tr-lg rounded-bl-lg rounded-br-lg grid grid-cols-3 gap-2 pl-2 py-1.5">
            {Array.from(categories)?.map((category, index) => {
                return <DisplayCategory key={index} category={category} />
            })}
        </div> : <p className="border-gray-800 border-3 p-1">No items in inventory</p>}
    </div>
}

interface DisplayCategoryProps {
    category: string
}

function DisplayCategory({ category }: DisplayCategoryProps) {
    return <div className="border-gray-400 border-2 px-2 py-1 rounded-full text-sm md:text-[16px] w-fit self-center text-center">
        <p>{category}</p>
    </div>
}

interface DisplayOptionsProps {
    item: Item,
    setItem: (option: Item) => void
}

function DisplayOptions({ item, setItem }: DisplayOptionsProps) {

    const [currOption, setCurrOption] = useState<string>("")
    const [selectedOption, setSelectedOption] = useState<string>(Object.keys(item.options)[0] || '')

    const [currentValues, setCurrentValues] = useState<string[]>([]);

    useEffect(() => {
        const updatedArr = [...(item.options[selectedOption] || []), ""]
        setCurrentValues(updatedArr);
    }, [item, selectedOption]);

    const handleAddOption = () => {
        if (!currOption) return

        const currentItem = { ...item }
        currentItem.options[currOption] = []

        setItem(currentItem)

        setSelectedOption(currOption)
        setCurrOption("")
    }

    return <div className="flex flex-col w-fit">
        <p className="w-fit border-gray-800 border-3 border-b-0 px-2 rounded-tr-2xl rounded-tl-2xl">Options</p>
        <div className="border-gray-800 border-3 p-2 rounded-bl-lg rounded-br-lg rounded-tr-lg">
            <p>Enter Option to add:</p>
            <div className="flex flex-row flex-wrap gap-2">
                <input type="text" className="pl-1 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors" value={currOption} onChange={(event) => setCurrOption(event.target.value)}></input>
                <button className="border-black border-1 px-3 rounded-full cursor-pointer" type="button" onClick={handleAddOption}>Add</button>
            </div>
            <div className="grid grid-cols-2 my-2 min-h-8 items-center p-1 gap-1">
                {Object.keys(item?.options).map((key) => (
                    <div key={key}>
                        <Option option={key} setSelectedOption={setSelectedOption} item={item} setItem={setItem} />
                    </div>
                ))}
            </div>
            {selectedOption?.length > 0 && <p>Enter values for {selectedOption}</p>}
            {Object.keys(item?.options).length > 0 && currentValues?.map((val, index) => (<Value key={index} val={val} item={item} setItem={setItem} selectedOption={selectedOption} />))}
        </div>
    </div>
}

interface ValueProps {
    val: string,
    item: Item,
    setItem: (item: Item) => void,
    selectedOption: string,
}

function Value({ val, item, selectedOption, setItem }: ValueProps) {
    const [option, setOption] = useState<string>(val.length > 0 ? val : "")
    const [added, setAdded] = useState<boolean>(false)

    useEffect(() => {
        setOption(val.length > 0 ? val : "")
        if (val.length == 0) {
            setAdded(false)
        } else {
            setAdded(true)
        }
    }, [val])

    const handleAddValue = () => {
        if (added) return
        const currentItem = { ...item }
        const currentOptionValues = currentItem.options[selectedOption] || []

        currentOptionValues.push(option)

        currentItem.options[selectedOption] = currentOptionValues
        setItem({ ...currentItem })

        setAdded(true)
    }

    const handleRemoveValue = () => {
        const currentItem = { ...item }

        const filteredOptions = currentItem.options[selectedOption].filter((currOption) => { return currOption.trim() != option.trim() }) || []

        currentItem.options[selectedOption] = filteredOptions
        setItem({ ...currentItem })
    }

    return <div className="flex flex-row items-center mb-2 space-x-2 h-8">
        <input type="text" className="border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 hover:border-blue-400 focus:border-blue-400 transition-colors border-2 pl-1 ml-2 w-1/4" value={option} readOnly={added && true} onChange={(event) => setOption(event.target.value)}></input>
        <button type="button" onClick={handleAddValue} className="border-black border-1 px-3 rounded-full cursor-pointer">Add</button>
        {(option?.length > 0 && added) && <button type="button" onClick={handleRemoveValue} className="border-black border-1 px-3 rounded-full cursor-pointer">Remove</button>}
    </div>
}

interface OptionProps {
    option: string,
    setSelectedOption: (option: string) => void,
    item: Item,
    setItem: (item: Item) => void,
}

function Option({ option, setSelectedOption, item, setItem }: OptionProps) {
    const handleRemoveOption = () => {
        const currentItem = { ...item }
        delete currentItem.options[option]

        setItem({ ...currentItem })

        if (Object.keys(currentItem.options).length > 0) {
            const resetSelectedOpt = currentItem.options[0] && currentItem.options[0][0] || ""
            setSelectedOption(resetSelectedOpt)
        } else {
            setSelectedOption("")
        }
    }
    return <div className="cursor-pointer border-2 border-gray-400 text-center w-fit px-2 space-x-1 rounded-full transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
        <button type="button" onClick={() => setSelectedOption(option)} className="cursor-pointer">{option}</button>
        <button className="self-end font-md cursor-pointer" onClick={handleRemoveOption} >-</button>
    </div>
}

interface ImageResponse {
    imageUrl: string;
}

interface PhotoUploadProps {
    photo: Photo;
    index: number;
    onPhotoChange: (index: number, photo: Photo) => void;
    onPhotoRemove: (index: number) => void;
}

function PhotoUpload({ photo, index, onPhotoChange, onPhotoRemove }: PhotoUploadProps) {
    const [error, setError] = useState<string>('')

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            console.error('Error retrieving uploaded file');
            return;
        }

        if (file.size >= 30 * 1024 * 1024) {
            setError('File size too large. Please choose a smaller image.');
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("filename", file.name.split('.')[0]);

        try {
            const res = await axios.post<ImageResponse>(`${apiUrl}/image/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true
            });

            onPhotoChange(index, { photo: res.data.imageUrl, tag: photo.tag || '' });
            event.target.value = "";
        } catch (error) {
            if (error && error instanceof AxiosError) {
                setError('Error uploading image, make sure format is of type jpeg, jpg, or png')
            }
        }
    };

    const handleTagChange = (tag: string) => {
        onPhotoChange(index, { ...photo, tag });
    };

    const handleRemove = () => {
        onPhotoRemove(index);
    };

    if (error.length > 0) { return <Error message={error} setError={setError} /> }

    return (
        <div className="flex flex-col items-center justify-center transition-all duration-300 ease-in-out hover:-translate-y-1">
            {photo.photo && photo.photo.length > 0 ? (
                <div className="w-full h-full relative">
                    <img src={photo.photo} className="w-auto h-44" alt="Uploaded" />
                    <button
                        className="bg-red-500 p-0.5 pt-0 pb-0 rounded-lg absolute top-0 left-1 text-white"
                        onClick={handleRemove}
                        type="button"
                    >
                        -
                    </button>
                    <input
                        className="border-2 w-1/2 my-2 text-md px-1"
                        placeholder="Tag"
                        value={photo.tag || ''}
                        onChange={(e) => handleTagChange(e.target.value)}
                    />
                </div>
            ) : (
                <div className="flex flex-col p-1">
                    <div className="flex flex-col relative items-center justify-center pl-2">
                        <img src={uploadPhotoICON} className="h-12 w-12" alt="Upload" />
                        <input
                            type="file"
                            className="text-transparent w-full h-full absolute top-0 cursor-pointer"
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

