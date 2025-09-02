interface ItemInvoice {
    description: string,
    amount: number,
    quantity: number,
}

interface Bill {
    fullName:  string,
    address:  string,
    country:  string,
    province:  string,
    city:  string,
    postalCode:  string,
    email:  string,
    phone?:  string | null
}

interface Order {
    _id?: string,
    items: ItemInvoice[],
    totalPrice: number,
    billingInfo: Bill,
    status: string,
    trackingNumber?: string | null,
    date: Date,
    local: boolean
}

export type {Bill, Order, ItemInvoice}