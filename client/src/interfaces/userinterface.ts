import { Item } from "./iteminterface";
import { Bill, Order } from "./orderInterface";

interface CartItem {
    item: Item,
    quantity: number
}

interface User {
    email: string,
    password: string,
    billingInfo: Bill,
    orderHistory: Order[],
    cart: CartItem[],
    role: string,
}

export type {User, CartItem}