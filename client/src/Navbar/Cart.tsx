import { useState } from "react"
import { useCart } from "../Contexts/cartContext"
import type { CartItem } from "../interfaces/userinterface"
import axios from "axios"
import { useAuth } from "../Contexts/authContext"
import { ShoppingCart, Plus, Minus, ArrowBigRight } from "lucide-react"

const apiUrl = import.meta.env.VITE_API_URL

interface checkoutResponse {
    url: string
}

export default function Cart() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const { cart } = useCart()

    const handleCheckout = async () => {
        if (!cart || cart.length === 0) return
        try {
            const res = await axios.post<checkoutResponse>(`${apiUrl}/payment/checkout`, { items: cart })
            const { url } = res.data

            window.location.href = url
        } catch (error) {
            window.alert(error)
        }
    }

    return (
        <div className="w-full relative">
            {/* Cart Button */}
            <div className="flex md:justify-end">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative flex items-center justify-center cursor-pointer"
                    aria-label="Open shopping cart"
                >
                    <ShoppingCart className="h-6 w-6 text-gray-800" />
                    {cart && cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#f8b4c4] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Cart Dropdown - Positioned like the original */}
            {isOpen && (
                <div
                    className="absolute top-0 left-0 md:left-auto md:right-0 z-10 bg-white text-black p-4 rounded shadow-lg w-80"
                    style={{
                        visibility: isOpen ? "visible" : "hidden",
                        opacity: isOpen ? 1 : 0,
                    }}
                >
                    <div className="flex flex-col w-full max-h-80 overflow-y-auto">
                        {/* Cart Header */}
                        <div className="flex flex-row items-center mb-2">
                            <h3 className="text-xl font-medium">Cart</h3>
                            <button onClick={() => setIsOpen(false)} className="font-regular flex flex-row ml-auto cursor-pointer">
                                Go Back <ArrowBigRight />
                            </button>
                        </div>

                        {/* Login Prompt */}
                        {!user && cart && cart.length > 0 && (
                            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-md p-2 mb-3">
                                <div className="w-1 h-10 bg-[#f8b4c4] rounded-full mr-2"></div>
                                <div>
                                    <p className="font-medium text-sm text-gray-800">Login to save your cart</p>
                                    <p className="text-xs text-gray-500">Your items will be saved for later</p>
                                </div>
                            </div>
                        )}

                        {cart && cart.length > 0 && <div className="flex items-center bg-gray-50 border border-gray-100 rounded-md p-2 mb-3">
                            <div className="w-1 h-10 bg-[#f8b4c4] rounded-full mr-2"></div>
                            <div>
                                <p className="font-medium text-sm text-gray-800">Spend $125 or more for free shipping</p>
                            </div>
                        </div>}

                        {/* Cart Items */}
                        <div className="flex flex-col w-full overflow-y-auto space-y-2 my-2">
                            {cart && cart.length > 0 ? (
                                cart.map((cartItem, index) => <Item key={index} item={cartItem} />)
                            ) : (
                                <div className="mx-auto font-bold py-4">
                                    <p>No items in cart</p>
                                </div>
                            )}
                        </div>

                        {/* Checkout Button */}
                        {cart && cart.length > 0 && (
                            <button
                                className="self-center my-2 bg-[#f8b4c4] p-2 text-white font-bold text-lg rounded-lg cursor-pointer w-full hover:bg-[#f5a1b5] transition-colors"
                                onClick={handleCheckout}
                            >
                                Checkout
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

interface ItemProps {
    item: CartItem
}

function Item({ item }: ItemProps) {
    const { addToCart, removeFromCart } = useCart()

    return (
        <div className="flex flex-row border border-gray-200 rounded-lg">
            <img src={item.item?.photos[0].photo || "/placeholder.svg"} alt={item.item?.photos[0].tag ? item.item.photos[0].tag : ''} className="w-[35%] object-cover" />

            <div className="flex flex-col pl-2 py-1 w-[65%]">
                <p className="font-medium text-sm">{item.item.name}</p>
                <p className="font-semibold text-sm">${Number(item.item.price).toFixed(2)}</p>

                <p className="text-xs text-gray-500 mt-1">Options</p>
                {Object.keys(item.item.options).map((option) => (
                    <div key={option} className="text-xs">
                        <p>{item.item.options[option]}</p>
                    </div>
                ))}

                <div className="flex flex-row self-end space-x-2 border border-gray-300 rounded-lg mr-2 px-1 mt-1">
                    <button onClick={() => removeFromCart(item)} className="text-gray-600 hover:text-gray-900">
                        <Minus className="h-3 w-3" />
                    </button>
                    <p className="text-sm">{item.quantity}</p>
                    <button
                        onClick={() => addToCart({ item: item.item, quantity: item.quantity + 1 })}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}

