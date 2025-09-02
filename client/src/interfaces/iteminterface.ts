interface Review {
    fullName: string,
    stars: number,
    description: string,
    photos: string[]
}

interface PhotoSchema {
    photo: string
    tag?: string
}

interface Item {
    name: string,
    price: number,
    category: string[],
    options: Record<string, string[]>,
    quantity: number,
    description: string,
    photos: PhotoSchema[],
    isBundle: boolean,
    priceOptions: Record<string, number>,
    reviews: Review[]
}
export type {Item, Review}