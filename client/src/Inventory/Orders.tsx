/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bill, ItemInvoice, Order } from "../interfaces/orderInterface"
import { useCallback, useEffect, useRef, useState } from "react"
import axios from "axios"
import Loading from "../Loading/Loading"
import Error from "../Loading/Error"
import { useAuth } from "../Contexts/authContext"
const apiUrl = import.meta.env.VITE_API_URL;

export default function Orders() {
    const { accessToken } = useAuth()
    const [statusFilter, setStatusFilter] = useState('All')
    const [orders, setOrders] = useState<Order[]>([])

    const { isFetching, error, data: ordersData = [] } = useQuery<Order[], Error>({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await axios.get<Order[]>(`${apiUrl}/orders/`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            return res.data
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchInterval: 2 * 60 * 1000
    })

    useEffect(() => {
        if (!ordersData || ordersData.length === 0) return
        setOrders(ordersData)
    }, [ordersData])

    useEffect(() => {
        if (!statusFilter || !ordersData) return

        if (statusFilter === "All") {
            setOrders(ordersData)
            return
        }

        const currOrders = ordersData.filter((order) => order.status.toLowerCase().trim() === statusFilter.toLowerCase().trim())
        setOrders(currOrders)
    }, [statusFilter, ordersData])

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center w-full p-12 space-y-1.5">
                <h3 className="text-lg md:text-2xl font-button">Loading Featured Products</h3>
                <Loading />
            </div>
        )
    }

    if (error) return <Error message={error.message} />

    return <div className="mb-2">
        <StatusNavbar setStatus={setStatusFilter} />
        {(isFetching) ? <div className="flex flex-col w-full items-center justify-center p-12 space-y-1.5">
            <p className="font-regular font-bold text-xl">Loading Orders</p>
            <Loading />
        </div> : <OrderMenu orders={orders} ordersData={ordersData} setOrders={setOrders} />}
    </div>
}

interface OrderMenuProps {
    orders: Order[],
    ordersData: Order[],
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>
}
function OrderMenu({ orders, ordersData, setOrders }: OrderMenuProps) {

    return <div>
        <SearchBar ordersData={ordersData} setOrders={setOrders} />
        <div className="w-full overflow-x-auto">
            <DisplayOrders orders={orders} />
        </div>
    </div>
}

interface StatusNavbarProps {
    setStatus: React.Dispatch<React.SetStateAction<string>>
}
function StatusNavbar({ setStatus }: StatusNavbarProps) {
    return <div className="flex flex-row w-full border-black border-b-2 items-center justify-center py-2 space-x-6 font-button">
        <button onClick={() => setStatus('All')} className="hover:text-blue-500 transition-colors duration-300 cursor-pointer">All</button>
        <button onClick={() => setStatus('Added')} className="hover:text-blue-500 transition-colors duration-300 cursor-pointer">Added</button>
        <button onClick={() => setStatus('In_Progress')} className="hover:text-blue-500 transition-colors duration-300 cursor-pointer">In Progress</button>
        <button onClick={() => setStatus('Fulfilled')} className="hover:text-blue-500 transition-colors duration-300 cursor-pointer">Fulfilled</button>
    </div>
}

interface SearchBarProps {
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
    ordersData: Order[]
}

function SearchBar({ ordersData, setOrders }: SearchBarProps) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("_id")

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


    const handleSearch = useCallback((searchTerm: string, property: keyof Order) => {
        setOrders(
            ordersData.filter((order) => {
                const value = order[property];
                if (typeof value === "string") {
                    return value.toLowerCase().includes(searchTerm.toLowerCase());
                }
                if (typeof value === "number") {
                    return value.toString().includes(searchTerm);
                }
                return false;
            })
        );
    }, [ordersData]);

    // Create the debounced version
    const debouncedSearch = useDebounce(handleSearch, 600);

    // Handler for input changes
    const handleSearchChange = (searchTerm: string, property: keyof Order) => {
        // Update the search input immediately
        setSearch(searchTerm);
        // Debounce the expensive filtering operation
        debouncedSearch(searchTerm, property);
    };


    return <div className="flex flex-row flex-wrap space-y-2 items-center my-2 pl-2 space-x-2">
        <div className="flex flex-row flex-wrap w-fit items-center relative">
            <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value, filter as keyof Order)}
                className="px-2.5 py-1.5 w-fit rounded-full bg-white border shadow-black  border-gray-200  hover:border-pink-300 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 transition-all duration-200 shadow-sm text-gray-800 placeholder-gray-400"
            />
            <button className="absolute right-3 text-gray-400 hover:text-pink-500 ">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
        </div>
        <label className="border-gray-600 border-2 px-2 py-1 rounded-full w-fit">
            Filter:
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value='_id'>ID</option>
                <option value='trackingNumber'>Tracking Number</option>
                <option value='date'>Date</option>
            </select>
        </label>
    </div>
}

interface DisplayOrdersProps {
    orders: Order[],
}

function DisplayOrders({ orders }: DisplayOrdersProps) {
    return <div className="w-[1650px] flex flex-row flex-wrap my-4 overflow-x-auto space-x-2 space-y-2 ml-2 overflow-y-auto">
        {orders?.map((order) => {
            return <DisplayOrder key={order._id} order={order} />
        })}
    </div>
}

interface DisplayOrderProps {
    order: Order
}

interface MutationProps {
    orderId: string,
    status?: string,
    trackingNumber?: string
}

function DisplayOrder({ order }: DisplayOrderProps) {
    const { accessToken } = useAuth();
    const [editOrder, setEditOrder] = useState(false);
    const [status, setStatus] = useState(order.status || " ");
    const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || " ");

    const queryClient = useQueryClient();

    const orderMutation = useMutation<void, Error, MutationProps>({
        mutationFn: async ({ orderId, status, trackingNumber }: MutationProps) => {
            await axios.put(`${apiUrl}/orders/${orderId}/`, { status: status, trackingNumber: trackingNumber }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] });
            await queryClient.refetchQueries({ queryKey: ["orders"] });
        }
    });



    async function handleOrderUpdate() {
        if (!order._id) return;

        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        const statusChanged = formattedStatus !== order.status.charAt(0).toUpperCase() + order.status.slice(1);
        const trackingNumberChanged = trackingNumber !== order.trackingNumber;

        if (statusChanged || trackingNumberChanged) {
            orderMutation.mutate({ orderId: order._id, status: status, trackingNumber: trackingNumber })
        }
    }

    return (
        <div className="flex flex-col border-gray-800 border-1 rounded-xl w-96 p-2 font-headerFont">
            <div className="flex flex-row border-black border-b-1 w-full pb-2">
                <div className="flex flex-col flex-grow overflow-hidden">
                    <label className="flex flex-row text-nowrap">
                        Order ID:<p className="font-regular truncate ml-1">{order._id}</p>
                    </label>
                    <label className="flex text-nowrap flex-row">
                        Tracking Number:
                        {(editOrder && !order.local) ? (
                            <input
                                className="w-32 ml-1 border-gray-700 border-2 rounded-lg font-regular hover:ring-blue-500 hover:ring-1 hover:border-blue-500"
                                defaultValue={order.trackingNumber || ""}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                        ) : (
                            <p className="ml-1 font-regular truncate">{(order.local ? "Not Available" : (order.trackingNumber || 'Not Available'))}</p>
                        )}
                    </label>
                    <label className="flex flex-row">
                        Local Pickup:
                        <p className="font-regular truncate ml-1">
                            {order.local ? "Yes" : "No"}
                        </p>
                    </label>
                </div>
                <div className="w-28 flex-shrink-0 flex items-start">
                    <Status status={status} setStatus={setStatus} editOrder={editOrder} />
                </div>
            </div>
            <div className="flex flex-row mt-2">
                <div className="flex flex-col w-2/3 pr-2">
                    <label className="flex flex-row">
                        Order placed on:
                        <p className="ml-1 font-regular">{new Date(order.date).toLocaleDateString()}</p>
                    </label>
                    <label className="flex flex-row">
                        Total Price:
                        <p className="ml-1 font-regular">${(order.totalPrice / 100).toFixed(2)}</p>
                    </label>
                    <label className="flex flex-col">
                        Billing Info:
                        <div className="flex flex-col ml-2">
                            {(Object.keys(order.billingInfo) as Array<keyof Bill>).map((billingInfoKey) => {
                                return (
                                    order.billingInfo[billingInfoKey] && (
                                        <label key={billingInfoKey} className="flex flex-row">
                                            {billingInfoKey
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/_/g, " ")
                                                .trim()
                                                .split(" ")
                                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(" ")}
                                            :
                                            <p className="ml-2 font-regular">{order.billingInfo[billingInfoKey]}</p>
                                        </label>
                                    )
                                );
                            })}
                        </div>
                    </label>
                    <label className="flex flex-col mb-0">
                        Items:
                        <div className="flex flex-col ml-2 max-h-40 overflow-y-auto pb-0">
                            {order.items.map((item: ItemInvoice, index) => (
                                <label key={`${item.description}-${index}`} className="mb-0">
                                    {item.description
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/_/g, " ")
                                        .trim()
                                        .split(" ")
                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(" ")}
                                    <p className="ml-2 font-regular mb-0">Quantity: {item.quantity}</p>
                                    <p className="ml-2 font-regular mb-0">Price: ${(item.amount / 100).toFixed(2)}</p>
                                </label>
                            ))}
                        </div>
                    </label>
                </div>
                <div className="flex flex-col w-1/3 items-end space-y-2">
                    <button
                        className="border-black border-1 shadow-gray-500 shadow-sm w-fit px-3 py-1 rounded-full font-bold font-button cursor-pointer"
                        onClick={() => setEditOrder((prev) => !prev)}
                    >
                        Edit
                    </button>
                    {editOrder && (
                        <button
                            className="border-black border-1 shadow-gray-500 shadow-sm w-fit px-3 py-1 rounded-full font-bold font-button cursor-pointer"
                            onClick={handleOrderUpdate}
                        >
                            Confirm
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

interface StatusProps {
    status: string;
    setStatus: React.Dispatch<React.SetStateAction<string>>;
    editOrder: boolean
}

function Status({ status, setStatus, editOrder }: StatusProps) {
    const statusColor = status.toLowerCase() === 'added' ? '#FF0000' :
        status.toLowerCase() === 'in_progress' ? '#FFA500' :
            '#008000';

    return editOrder ? <div>
        <label>
            Select Status:
            <div className="flex flex-col space-y-1 font-bold font-button text-white">
                <button
                    className={`bg-[#FF0000] cursor-pointer rounded-full px-2 py-1 
                    ${status === 'added' ? 'border-4 border-black' : ''}`}
                    onClick={() => setStatus('added')}
                >
                    Added
                </button>
                <button
                    className={`bg-[#FFA500] cursor-pointer rounded-full px-2 py-1 
                    ${status === 'in_progress' ? 'border-4 border-black' : ''}`}
                    onClick={() => setStatus('in_progress')}
                >
                    In Progress
                </button>
                <button
                    className={`bg-[#008000] cursor-pointer rounded-full px-2 py-1 
                    ${status === 'fulfilled' ? 'border-4 border-black' : ''}`}
                    onClick={() => setStatus('fulfilled')}
                >
                    Fulfilled
                </button>
            </div>
        </label>
    </div> : <div style={{ backgroundColor: `${statusColor}` }} className="ml-auto rounded-full px-2 py-1 text-white font-bold font-button border-black border-2 shadow-gray-500 shadow-sm">
        <p>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
    </div>;
}