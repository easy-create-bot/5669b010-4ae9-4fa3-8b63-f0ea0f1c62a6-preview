import React, { useEffect, useRef, useState } from "react";
import Drawer from "../Navbar/Drawer";
import Rating from '@mui/material/Rating';
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Item, Review } from "../interfaces/iteminterface";
import axios from "axios";
import uploadPhotoICON from '../assets/uploadPhotoICON.png'
import { useCart } from "../Contexts/cartContext";
import Loading from "../Loading/Loading";
import Error from "../Loading/Error";
import { useAuth } from "../Contexts/authContext";
const apiUrl = import.meta.env.VITE_API_URL;

export default function ItemPage() {
    const { name } = useParams()

    const { isPending, isFetching, isError, data: item, error } = useQuery<Item, Error>({
        queryKey: [name],
        queryFn: async () => {
            const res = await axios.get<Item>(`${apiUrl}/inventory/item/${name}`);
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });

    if (isPending) {
        return <div className="h-screen flex w-full items-center justify-center">
            <Loading />
        </div>
    }
    if (isError) { return <Error message={error.message} /> }

    return (
        <div className="">
            <Drawer />
            <div className="w-full h-full py-6">
                {(isFetching || isPending) ? <div className="flex flex-col w-full items-center justify-center p-12 space-y-1.5">
                    <p className="font-regular font-bold text-xl">Loading Shop Items</p>
                    <Loading />
                </div> :
                    item && <DisplayItem item={item} />
                }
            </div>
        </div>
    )
}

interface DisplayItemProps {
    item: Item
}

function DisplayItem({ item }: DisplayItemProps) {
    const [photoUrl, setPhotoUrl] = useState(item?.photos?.[0]?.photo ?? '')

    return (
        <div className="w-[90%] md:w-[90%] h-fit flex flex-col mx-auto shadow-black shadow-lg pb-4">
            <div className="flex flex-col md:flex-row w-full h-[90%] bg-white">
                <div className="flex flex-col h-full items-center mx-auto space-y-2 md:space-y-0 py-2">
                    <img src={photoUrl} alt={item?.photos?.[0]?.tag ?? ''} className="w-fit h-[50vh] md:h-[70vh] object-contain max-w-[50%]"></img>
                    <ImageSlider item={item} setPhotoUrl={setPhotoUrl} />
                </div>
                <div className="w-full md:w-1/2 h-full flex flex-col px-4 md:pl-0">
                    <ItemDescription item={item} />
                </div>
            </div>
            <Reviews item={item} />
        </div>
    )
}

interface ImageSliderProps {
    item: Item,
    setPhotoUrl: (url: string) => void
}

function ImageSlider({ item, setPhotoUrl }: ImageSliderProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const photos = item.photos

    const handleButtonClick = (photoIndex: number) => {
        setPhotoUrl(photos[photoIndex].photo)
        setSelectedIndex(photoIndex)
    }

    const handlePhotoChange = (photo: string, index: number) => {
        setPhotoUrl(photo);
        setSelectedIndex(index);
    }

    return < div className="w-full flex flex-col  items-center justify-center" >
        <div className="flex flex-row w-full p-2 justify-center space-x-3">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((photo, index) => {
                    return <img key={index} src={photo?.photo ?? ''} alt={photo?.tag ?? ''} className="cursor-pointer  w-18 object-contain md:w-auto h-18" onClick={() => handlePhotoChange(photo?.photo ?? '', index)}></img>
                })}
            </div>
        </div>
        <div className="grid grid-cols-5 pb-1 gap-2">
            {(photos && photos.length > 0) && photos.map((_, index) => {
                return <button key={index} style={index === selectedIndex ? { backgroundColor: 'pink' } : {}} className="w-4 h-4 rounded-lg border-gray-400 border-2 cursor-pointer focus:ring-actionColor hover:border-actionColor focus:border-actionColor transition-colors" onClick={() => handleButtonClick(index)}></button>
            })}
        </div>
    </div >
}

function ItemDescription({ item }: DisplayItemProps) {
    const { cart, addToCart, removeFromCart } = useCart()
    const [tempItem, setTempItem] = useState<Item>({
        ...item,
        options: {}
    })

    // Track the last non-customMSG options for comparison
    const lastOptionsRef = useRef({});
    const isInitialRender = useRef(true);

    useEffect(() => {
        const itemQuantity = retrieveItem()[0];
        const itemInCartOptions = retrieveItem()[1];

        // Check if item is in cart and has customMSG
        if (itemInCartOptions != null && itemInCartOptions["customMSG"]) {
            const customMSG = itemInCartOptions["customMSG"][0]
            if (customMSG && customMSG != "") {
                setCustomMsg(customMSG)
            } else {
                setCustomMsg("")
            }
        } else if (!isInitialRender.current) {
            // Extract current options excluding customMSG for comparison
            const currentOptionsExcludingMsg = { ...tempItem.options };
            delete currentOptionsExcludingMsg?.customMSG;

            // Check if actual product options changed (not just customMSG)
            const optionsChanged = JSON.stringify(currentOptionsExcludingMsg) !== JSON.stringify(lastOptionsRef.current);

            // Reset customMsg only if options changed and not on initial render
            if (optionsChanged) {
                setCustomMsg("");
                // Also remove customMSG from tempItem if it exists
                if (tempItem.options?.customMSG) {
                    setTempItem(prev => {
                        const newOptions = { ...prev.options };
                        delete newOptions.customMSG;
                        return { ...prev, options: newOptions };
                    });
                }
            }
        }

        // Extract current options excluding customMSG and update reference
        const currentOptionsExcludingMsg = { ...tempItem.options };
        delete currentOptionsExcludingMsg?.customMSG;
        lastOptionsRef.current = currentOptionsExcludingMsg;

        // Update quantity
        setQuantity(itemQuantity);

        // Mark that initial render is complete
        isInitialRender.current = false;
    }, [tempItem.options])


    const retrieveItem = (): [number, Record<string, string[]> | null] => {
        if (!cart) return [0, null];

        const itemIndex = cart.findIndex((currItem) => {
            // For Custom Order items, compare options excluding customMSG
            if (item.category.includes("Custom Order")) {
                // First ensure item name matches
                if (currItem.item.name !== item.name) return false;

                // Compare all options except customMSG
                const tempItemOptionKeys = Object.keys(tempItem.options || {}).filter(key => key !== "customMSG");
                const cartItemOptionKeys = Object.keys(currItem.item.options || {}).filter(key => key !== "customMSG");

                // Check if they have the same keys (excluding customMSG)
                if (JSON.stringify(tempItemOptionKeys.sort()) !== JSON.stringify(cartItemOptionKeys.sort())) return false;

                // Compare the values of each option (excluding customMSG)
                for (const key of tempItemOptionKeys) {
                    if (JSON.stringify(tempItem.options[key]) !== JSON.stringify(currItem.item.options[key])) {
                        return false;
                    }
                }

                return true;
            } else {
                // For non-Custom Order items, compare name and entire options object
                return currItem.item.name === item.name &&
                    JSON.stringify(currItem.item.options) === JSON.stringify(tempItem.options);
            }
        });

        if (itemIndex !== -1) {
            return [cart[itemIndex].quantity, cart[itemIndex].item.options];
        } else {
            return [0, null];
        }
    }

    const [errorAddingToCart, setErrorAddingToCart] = useState<string>("");
    const [customMsg, setCustomMsg] = useState<string>("");
    const [quantity, setQuantity] = useState(() => retrieveItem()[0])

    const [currentBundleOpts] = useState<Record<string, number>>(
        (item.priceOptions && Object.keys(item.priceOptions).length > 0) ?
            Object.fromEntries(
                Object.entries(item.priceOptions).sort(([a], [b]) => Number(a) - Number(b))
            ) : {}
    )

    // Extract sorted bundle amounts as numbers
    const [bundleAmounts] = useState<number[]>(
        Object.keys(currentBundleOpts).length > 0
            ? Object.keys(currentBundleOpts).map((key) => Number(key))
            : []
    )

    // Initialize with the lowest bundle amount
    const retrieveBundleAmt = () => {
        if (bundleAmounts.length > 0) {
            return bundleAmounts[0];
        } else {
            return 1;
        }
    }

    const [selectedBundle, setSelectedBundle] = useState<number>(retrieveBundleAmt())

    // Set initial price based on selected bundle
    useEffect(() => {
        if (bundleAmounts.length > 0) {
            const price = currentBundleOpts[selectedBundle];
            setTempItem(prev => ({
                ...prev,
                price: price
            }));
        }
    }, [selectedBundle, bundleAmounts.length, currentBundleOpts])

    const handleBundleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newBundle = Number(e.target.value);
        setSelectedBundle(newBundle);

        // If there are items in the cart, update them with the new bundle
        if (quantity > 0) {
            const newPrice = currentBundleOpts[newBundle];

            // Create a new tempItem with updated price
            const updatedItem = {
                ...tempItem,
                price: newPrice
            };

            // Update the tempItem state
            setTempItem(updatedItem);

            // Update the cart with the new quantity and price
            removeFromCart({ item: tempItem, quantity: 0 }); // Remove old item
            addToCart({ item: updatedItem, quantity: newBundle }); // Add updated item
        }
    }

    const handleAddToCart = () => {
        if (item.category.includes("Custom Order") && customMsg.length === 0) {
            setErrorAddingToCart("Personalization Box must be filled in!");
            return;
        }
        if (bundleAmounts.length > 0) {
            // Bundle case - original functionality
            if (quantity > 0) return;

            const newQuantity = selectedBundle;
            const price = currentBundleOpts[selectedBundle];

            // Create a new tempItem with the updated price to ensure price sync
            const updatedItem = {
                ...tempItem,
                price: price
            };

            // Update the tempItem state
            setTempItem(updatedItem);

            // Add the item with the selected bundle quantity to the cart
            addToCart({ item: updatedItem, quantity: newQuantity });
            setQuantity(newQuantity);
        } else {
            // Non-bundle case - add 1 item
            const updatedItem = {
                ...tempItem,
                price: tempItem.price
            };

            // Add one item to the cart
            addToCart({ item: updatedItem, quantity: quantity + 1 });
            setQuantity(quantity + 1);
        }
    }

    const handleRemoveFromCart = () => {
        if (quantity <= 0) return;

        // Create item with correct price
        const updatedItem = {
            ...tempItem,
            price: tempItem.price
        };

        // Remove one item from cart
        if (bundleAmounts.length > 0) {
            // Bundle case - original functionality
            removeFromCart({ item: updatedItem, quantity: 0 });
            setQuantity(0);
        } else {
            // Non-bundle case - remove 1 item
            const newQuantity = quantity - 1;
            removeFromCart({ item: updatedItem, quantity: newQuantity });
            setQuantity(newQuantity);
        }
    }

    const handleClearCart = () => {
        if (quantity === 0) return;

        // Create item with correct price
        const updatedItem = {
            ...tempItem,
            price: bundleAmounts.length > 0 ? currentBundleOpts[selectedBundle] : tempItem.price
        };

        // Remove the item from cart by setting quantity to 0
        removeFromCart({ item: updatedItem, quantity: 0 });
        setQuantity(0);
        if (customMsg && customMsg.length > 0) {
            setCustomMsg("")
        }
    }

    const HandleCustomMsg = (msg: string) => {
        setErrorAddingToCart("");
        setCustomMsg(msg);

        setTempItem((prevItem) => {
            const newOptions = { ...prevItem.options, customMSG: [msg] };
            return { ...prevItem, options: newOptions }
        })
    }

    return <div className="flex flex-col h-full text-lg pt-1 w-full">
        <div className="flex flex-col">
            <h3 className="text-2xl md:text-3xl font-headerFont">{item.name}</h3>
            <p className="text-lg md:text-xl font-regular">${Number(tempItem.price).toFixed(2)}</p>
        </div>
        <div className="flex flex-row items-center space-x-1 font-regular pt-4 md:pt-24">
            <DisplayOptions options={item.options} setItem={setTempItem} />
        </div>

        {(item.category.includes("Custom Order") && Number(item.price) > 0) &&
            <div className="mt-2 flex flex-col">
                <label className="font-button">
                    {errorAddingToCart.length > 0 && <p className="text-red-400">{errorAddingToCart}</p>}
                    How Do You Want It Personalized?
                    <textarea className="border-gray-400 border-2 px-1 w-full md:w-[80%] resize-none font-regular" value={customMsg} onChange={(e) => HandleCustomMsg(e.target.value)}></textarea>
                </label>
            </div>}

        {
            Object.keys(currentBundleOpts).length > 0 ? (
                <div className="flex flex-col space-y-4 pt-4">
                    <div className="flex flex-col space-y-2">
                        <select
                            value={selectedBundle}
                            onChange={handleBundleChange}
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            {bundleAmounts.map((amount) => (
                                <option key={amount} value={amount}>
                                    {amount} items for ${currentBundleOpts[amount].toFixed(2)}
                                </option>
                            ))}
                        </select>

                        {(quantity === 0) ? (
                            <button
                                onClick={() => handleAddToCart()}
                                className="md:self-start self-center w-fit my-2 text-lg md:text-xl border-black border-1 cursor-pointer rounded-full p-2 px-4 shadow-gray-400 shadow-sm hover:border-actionColor hover:border-2 font-button"
                            >
                                Add To Cart
                            </button>
                        ) : (
                            <div className="flex flex-col space-y-2">
                                <p className="font-regular">
                                    <span className="font-bold">{quantity} items</span> in cart at <span className="font-bold">${tempItem.price.toFixed(2)}/each</span>
                                </p>
                                <button
                                    onClick={handleClearCart}
                                    className="md:self-start self-center w-fit text-lg md:text-xl border-black border-1 cursor-pointer rounded-full p-2 px-4 shadow-gray-400 shadow-sm hover:border-red-500 hover:border-2 font-button"
                                >
                                    Remove From Cart
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                item.price > 0 &&
                <div className="flex flex-col space-y-4 pt-4">
                    <div className="flex flex-col space-y-2">
                        {quantity === 0 ? (
                            <button
                                onClick={() => handleAddToCart()}
                                className="md:self-start self-center w-fit my-2 text-lg md:text-xl border-black border-1 cursor-pointer rounded-full p-2 px-4 shadow-gray-400 shadow-sm hover:border-actionColor hover:border-2 font-button"
                            >
                                Add To Cart
                            </button>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleRemoveFromCart}
                                    className="px-3 py-1 text-xl font-bold border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    -
                                </button>
                                <span className="px-3 py-1 font-bold">{quantity}</span>
                                <button
                                    onClick={handleAddToCart}
                                    className="px-3 py-1 text-xl font-bold border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    +
                                </button>
                                <button
                                    onClick={handleClearCart}
                                    className="ml-2 md:self-start self-center w-fit text-lg md:text-xl border-black border-1 cursor-pointer rounded-full p-2 px-4 shadow-gray-400 shadow-sm hover:border-red-500 hover:border-2 font-button"
                                >
                                    Remove All
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        {/*
        {(quantity > 0 && item.category.includes('Custom Order')) && <p className="font-button text-md">
            * Quantity wanted must match number of items requested for personalization
        </p>}
        */}
        <div className="flex flex-col pt-4 w-[100%]">
            <p className="font-button font-bold">About this item: </p>
            <p className="font-regular text-md ml-2 md:ml-0" dangerouslySetInnerHTML={{ __html: item.description.replace(/\n/g, '<br>') }}></p>
        </div>
    </div >
}


interface DisplayOptionsProps {
    setItem: React.Dispatch<React.SetStateAction<Item>>,
    options: Record<string, string[]>
}
function DisplayOptions({ options, setItem }: DisplayOptionsProps) {
    const initialOptions = Object.keys(options).reduce((acc, key) => {
        if (key !== 'customMSG' && options[key].length > 0) {
            acc[key] = [options[key][0]];
        }
        return acc;
    }, {} as Record<string, string[]>);

    const [currOptions, setCurrOptions] = useState<Record<string, string[]>>(initialOptions)
    useEffect(() => {
        setItem((prevItem) => {
            // Create new options object without the customMSG key
            const newOptions = { ...currOptions };
            // Keep customMSG if it exists in prevItem options
            if (prevItem.options && prevItem.options.customMSG) {
                newOptions.customMSG = prevItem.options.customMSG;
            }

            return { ...prevItem, options: newOptions }
        })
    }, [currOptions, setItem])
    return <div className="flex flex-col space-y-2">
        {Object.keys(options).map((option) => {
            return option != "customMSG" && <label key={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}:
                <DisplayOption option={option} optionValues={options} currOptions={currOptions} setCurrOptions={setCurrOptions} />
            </label>
        })}
    </div>
}

interface DisplayOptionProps {
    option: string,
    optionValues: Record<string, string[]>,
    currOptions: Record<string, string[]>,
    setCurrOptions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
}

function DisplayOption({ option, optionValues, currOptions, setCurrOptions }: DisplayOptionProps) {

    const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrOptions((prevOptions) => {
            return { ...prevOptions, [option]: [e.target.value] }
        })
    }

    return <select className="border-1 border-black ml-1 p-1 px-2 rounded-full shadow-gray-600 shadow-sm hover:border-actionColor cursor-pointer" value={currOptions && currOptions[option]?.[0] ? (currOptions[option])[0] : ''} onChange={(e) => handleOptionChange(e)}>
        {(optionValues && Object.keys(optionValues).length > 0) && optionValues[option].map((currValue) => {
            return <option key={currValue} value={currValue}>{currValue}</option>
        })}
    </select>
}

function Reviews({ item }: DisplayItemProps) {
    const { user } = useAuth()
    const [canReview, setCanReview] = useState(false)
    const [leaveReview, setLeaveReview] = useState(false)

    const checkReview = async () => {
        if (!user || !user.email) return
        try {
            const res = await axios.get(`${apiUrl}/inventory/item/${item.name}/review?userEmail=${user.email}`)
            if (res.status === 200) {
                setCanReview(true)
            } else {
                setCanReview(false)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        checkReview()
    }, [user])



    return <div className="flex flex-col self-center  w-[95%] h-fit">
        <div className="flex flex-col md:flex-row py-1">
            <h3 className="font-headerFont text-2xl">Reviews</h3>
            {canReview && <button className=" w-fit md:ml-auto text-xl md:mr-8 rounded-lg p-1 font-button bg-[#f8b4c4] text-white font-bold cursor-pointer" onClick={() => setLeaveReview((review) => !review)}>{leaveReview ? 'Go Back' : 'Leave a review'}</button>}
        </div>
        {leaveReview && <AddReview item={item} setLeaveReview={setLeaveReview} />}
        <div className="flex flex-col space-y-6 mb-2">
            {(item && item.reviews.length > 0) ? item.reviews?.map((review: Review, index) => {
                return <DisplayReview key={index} review={review} />
            }) :
                <p className="mx-auto font-regular">There are no reviews for this item yet.</p>
            }
        </div>
    </div>
}

interface ImageResponse {
    imageUrl: string;
}

interface AddReviewProps {
    item: Item,
    setLeaveReview: (flag: boolean) => void
}

function AddReview({ item, setLeaveReview }: AddReviewProps) {
    const queryClient = useQueryClient()

    const [review, setReview] = useState<Review>({
        fullName: "First name Last name / Date",
        stars: 5,
        description: "",
        photos: []
    })

    const mutation = useMutation(
        {
            mutationFn: async (review: Review) => {
                const response = await axios.put(`${apiUrl}/inventory/item/${item.name}/review`, { review: review })
                return response.data
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['inventory'] })
                queryClient.invalidateQueries({ queryKey: ['inventory', item.category] })
                queryClient.invalidateQueries({ queryKey: [item.name] })
            }
        }
    )

    const handleReviewChange = (property: keyof Review, value: string | string[] | number | null) => {
        if (value === null) return
        setReview((prevReview) => ({
            ...prevReview,
            [property]: value
        }))
    }

    const handleAddReview = async () => {
        mutation.mutate(review)
        setLeaveReview(false)
        setReview({
            fullName: "First name Last name / Date",
            stars: 5,
            description: "",
            photos: []
        })
    }

    return <div className="flex flex-col mb-4 font-regular">
        <p>{review.fullName}</p>
        <Rating name="half-rating" value={review.stars} onChange={(event, newValue) => handleReviewChange('stars', newValue)} precision={0.5} />
        <textarea className="border-black border-1 w-[80%] resize-none pl-0.5 my-1" value={review.description} onChange={(event) => handleReviewChange('description', event.target.value)}></textarea>
        <UploadPhoto review={review} handleReviewChange={handleReviewChange} />
        <button className="self-start my-2 p-1 rounded-lg font-button bg-[#f8b4c4] text-white font-bold" onClick={handleAddReview}>Add Review</button>
    </div>
}

interface UploadPhotoProps {
    review: Review,
    handleReviewChange: (property: keyof Review, value: string | string[] | number | null) => void
}

function UploadPhoto({ review, handleReviewChange }: UploadPhotoProps) {
    const [photoUrl, setPhotoUrl] = useState("")

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        if (!file) {
            console.error('Error retrieving uploaded file')
            return
        }

        const formData = new FormData()
        formData.append("image", file)

        try {
            const res = await axios.post<ImageResponse>(`${apiUrl}/image/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })
            setPhotoUrl(res.data.imageUrl)
            const newPhotos = review.photos
            newPhotos.push(res.data.imageUrl)
            handleReviewChange('photos', newPhotos)
            event.target.value = ""
        } catch (error) {
            console.error(error)
        }
    }

    const handleFileRemove = () => {
        const photos = review.photos
        const filteredPhotos = photos.filter((photo) => photo !== photoUrl)

        handleReviewChange('photos', filteredPhotos)
        setPhotoUrl('')
    }

    return <div>
        {(photoUrl && photoUrl.length > 0) ?
            <div className="w-full h-full relative">
                <img src={photoUrl} className="w-28 h-28"></img>
                <button className="bg-red-500 p-0.5 pt-0 pb-0 rounded-lg absolute top-0 left-1 text-white" onClick={handleFileRemove}>-</button>
            </div>
            :
            <div className="flex flex-col">
                <div className="flex flex-col w-fit h-24 relative items-center justify-center pl-2">
                    <p>Click to upload photo</p>
                    <img src={uploadPhotoICON} className="h-10 w-10"></img>
                    <input type="file" className="text-transparent w-full h-full absolute top-0" onChange={(event) => handleFileUpload(event)}></input>
                </div>
            </div>}
    </div>
}

interface ReviewProps {
    review: Review
}

function DisplayReview({ review }: ReviewProps) {
    return <div className="flex flex-col font-regular w-[80%]">
        <p>{review.fullName}</p>
        <Rating name="half-rating" defaultValue={review.stars} precision={0.5} readOnly />
        <p>{review.description}</p>
        <div className="flex flex-row">
            {review.photos?.map((photo, index) => {
                return <img src={photo} key={index} className="w-22"></img>
            })}
        </div>
    </div>
}