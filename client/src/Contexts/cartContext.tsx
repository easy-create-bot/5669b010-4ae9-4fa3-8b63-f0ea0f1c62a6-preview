import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { CartItem } from "../interfaces/userinterface";
import { useAuth } from "./authContext";
import axios from "axios";
import { debounce } from 'lodash'; // You'll need to install lodash: npm install lodash @types/lodash

const apiUrl = import.meta.env.VITE_API_URL;

interface CartContextType {
    cart: CartItem[] | null;
    addToCart: (item: CartItem) => void;
    removeFromCart: (item: CartItem) => void;
    resetCart: () => void;
}

const CartContext = createContext<CartContextType>({
    cart: null,
    addToCart: () => { },
    removeFromCart: () => { },
    resetCart: () => { },
})

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, accessToken } = useAuth()

    const [cart, setCart] = useState<CartItem[] | null>(user ? user.cart : [])

    const saveCartOnUnload = useCallback(async () => {
        if (!user?.email) return
        let userCart: CartItem[]

        if (!cart) {
            userCart = []
        } else {
            userCart = cart
        }

        try {
            await axios.put(`${apiUrl}/users/cart/${user.email}`, { cart: userCart }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
        } catch (error) {
            console.error(error)
        }
    }, [cart, user?.email, accessToken])

    // Create a debounced save function
    const debouncedSaveCart = useCallback(
        debounce(async (cartItems: CartItem[]) => {
            if (!user?.email || !accessToken) return;

            try {
                await axios.put(`${apiUrl}/users/cart/${user.email}`,
                    { cart: cartItems },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                );
            } catch (error) {
                console.error('Failed to save cart:', error);
            }
        }, 1000), // Wait 1 second after last change
        [user?.email, accessToken]
    );

    // Save cart whenever it changes
    useEffect(() => {
        if (cart && user) {
            debouncedSaveCart(cart);
        }
    }, [cart, user, debouncedSaveCart]);

    // Cleanup debounced function
    useEffect(() => {
        return () => {
            debouncedSaveCart.cancel();
        };
    }, [debouncedSaveCart]);

    const resetCart = async () => {
        if (!user) return;
        try {
            await axios.put(`${apiUrl}/users/cart/${user.email}`, { cart: [] }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            setCart([])
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {

        window.addEventListener('beforeunload', saveCartOnUnload)
        return () => {
            window.removeEventListener('beforeunload', saveCartOnUnload)
        }
    }, [saveCartOnUnload])

    useEffect(() => {
        if (!user) {
            setCart([])
            return
        }

        setCart(user.cart)
    }, [user])

    const addToCart = (item: CartItem) => {
        setCart((prevCart) => {
            if (!prevCart || prevCart.length == 0) return [{ ...item, quantity: item.quantity > 0 ? item.quantity : 1 }];

            // Check if item exists by name and options
            const itemIndex = prevCart.findIndex(
                (currItem) =>
                    currItem.item.name === item.item.name &&
                    JSON.stringify(currItem.item.options) === JSON.stringify(item.item.options)
            );

            // If the item has isBundle flag, we don't allow adding more of it if it already exists
            if (item.item.isBundle && itemIndex !== -1) {
                // Just update the existing bundle (price, etc.) but don't change quantity
                return prevCart.map((currItem, index) =>
                    index === itemIndex
                        ? {
                            ...currItem,
                            item: {
                                ...currItem.item,
                                price: item.item.price,
                            }
                        }
                        : currItem
                );
            }

            // For non-bundle items or new bundle items
            if (itemIndex !== -1) {
                return prevCart.map((currItem, index) =>
                    index === itemIndex
                        ? {
                            ...currItem,
                            quantity: item.item.isBundle ? item.quantity : (item.quantity > 0 ? item.quantity : 1),
                            item: {
                                ...currItem.item,
                                price: item.item.price,
                                isBundle: item.item.isBundle
                            }
                        }
                        : currItem
                );
            }

            return [...prevCart, {
                ...item,
                quantity: item.quantity > 0 ? item.quantity : 1,
                item: {
                    ...item.item,
                    isBundle: item.item.isBundle
                }
            }];
        });
    }

    const removeFromCart = (item: CartItem) => {
        if (!cart) return

        const itemIndex = cart.findIndex((currItem) => {
            // Compare item names
            if (currItem.item.name !== item.item.name) return false;

            // Get options keys for both items, excluding customMSG
            const currItemOptionKeys = Object.keys(currItem.item.options || {}).filter(key => key !== "customMSG");
            const itemOptionKeys = Object.keys(item.item.options || {}).filter(key => key !== "customMSG");

            // Check if they have the same keys (excluding customMSG)
            if (JSON.stringify(currItemOptionKeys.sort()) !== JSON.stringify(itemOptionKeys.sort())) return false;

            // Compare the values of each option (excluding customMSG)
            for (const key of currItemOptionKeys) {
                if (JSON.stringify(currItem.item.options[key]) !== JSON.stringify(item.item.options[key])) {
                    return false;
                }
            }

            return true;
        });

        if (itemIndex === -1) return

        const newCart = [...cart]

        // If it's a bundle or item.quantity is explicitly set to 0, remove the entire item
        if (cart[itemIndex].item.isBundle || item.quantity === 0) {
            newCart.splice(itemIndex, 1)
        } else {
            // For regular items, decrement quantity if > 1
            if (cart[itemIndex].quantity > 1) {
                newCart[itemIndex] = {
                    ...newCart[itemIndex],
                    quantity: newCart[itemIndex].quantity - 1,
                    item: {
                        ...newCart[itemIndex].item,
                        options: item.item.options,
                        price: item.item.price
                    }
                }
            } else {
                newCart.splice(itemIndex, 1)
            }
        }

        setCart(newCart)
    }

    return <CartContext.Provider value={{ cart, addToCart, removeFromCart, resetCart }}>
        {children}
    </CartContext.Provider>
}