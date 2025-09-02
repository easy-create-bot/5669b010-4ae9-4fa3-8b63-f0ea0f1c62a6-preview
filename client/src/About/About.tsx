
import { useState, useEffect, FormEvent } from "react"
import { Mail, MapPin } from "lucide-react"
import Drawer from "../Navbar/Drawer"
import axios, { isAxiosError } from "axios"
import Error from "../Loading/Error"
import laser from '../assets/AboutPics/laser.jpg'
import macbook from '../assets/AboutPics/macbook.jpg'
import printer from '../assets/AboutPics/printer.jpg'
const apiUrl = import.meta.env.VITE_API_URL;


export default function About() {
    return (
        <div>
            <Drawer />
            <AboutPage />
        </div>
    )
}

interface Message {
    name: string,
    email: string,
    message: string
}

function AboutPage() {

    // Image slider state
    const [currentImage, setCurrentImage] = useState(0)
    const [images] = useState([
        laser,
        macbook,
        printer,
    ])

    // About section state
    const [aboutText] = useState([
        "Hi I’m Donna, the founder of Heartland Shoppes. I was born in small town Alberta, and my family moved to Toronto, Ontario then we settled in Calgary, Alberta. ",
        "Upon getting married, our family has lived in many cities and towns across Alberta, and have now settled in Southern Alberta.",
        "My love of crafting has always been with me, as my mom was into ceramics and would often ask if I would like to go with her. It was nice creating something different and unique. In high school, I took shop as I loved working with all the different mediums and again the fun of seeing an idea come too fruition.",
        "I learned at a young age that I really did enjoy unique gifts, not cookie cutter ones that everyone else received, again attributed to my mom who made gifts for her friends and family and seeing their expressions upon receipt. I remember one year, my parents had no idea what to get me for Christmas, and they ended up buying me a knitting machine. Needless to say I wore it out.",
        "My vision for this new venture is to bring ideas to life. I would like to be a go to, when people can’t seem to find that perfect gift. Retailers have all kinds of gifts that can express different feelings, but I find they are to generic. I want my gift to enable an emotional reaction from them, and one they will proudly display in their home.",
        " I believe you shouldn’t have to compromise style for function. We are passionate about designing one of a kind items to be used everyday, or to hang beautifully in your home."
    ])


    const [message, setMessage] = useState<Message>({
        name: "", email: "", message: ""
    })
    const [error, setError] = useState("")
    const [messageSent, setMessageSent] = useState<boolean>(false)

    // Auto-rotate images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
        }, 10000)
        return () => clearInterval(interval)
    }, [images.length])

    // Manual navigation
    const goToImage = (index: number) => {
        setCurrentImage(index)
    }

    const handleChangeMessage = (property: keyof Message, value: string) => {
        setMessage((prevMessage) => ({
            ...prevMessage,
            [property]: value
        }))
    }

    const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (message.email.length === 0 || message.name.length === 0 || message.message.length === 0) {
            setError("All inputs must be filled before sending inquiry")
            return
        }

        try {
            const res = await axios.post(`${apiUrl}/email/inquire`, { userInquiry: message })
            if (res.status === 200) {
                setMessageSent(true)
            }
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                setError(error.response.data)
            }
        }
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {(error && error.length > 0) && <Error message={error} />}
            <div className="max-w-4xl mx-auto">
                {/* Image Slider with Edit Button */}
                <div className="relative mb-8">
                    <div className="relative h-[400px] rounded-lg overflow-hidden">
                        {images.map((src, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-1000 ${currentImage === index ? "opacity-100" : "opacity-0"
                                    }`}
                            >
                                <img
                                    src={src || "https://via.placeholder.com/1200x400"}
                                    alt={`Handmade product image ${index + 1}`}
                                    className="w-full h-full object-contain"
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            </div>
                        ))}

                        {/* Image navigation dots */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToImage(index)}
                                    className={`w-3 h-3 rounded-full border-black border-1 ${currentImage === index ? "bg-white" : "bg-white/50"}`}
                                    aria-label={`Go to image ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tagline */}
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold">Everything made from the Heart. Handmade with love.</h2>
                </div>

                {/* About Store Section */}
                <div className="mb-16">
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold">My Story</h2>
                    </div>

                    <div className="prose max-w-none">
                        {aboutText.map((paragraph, index) => (
                            <p key={index} className={` ${index > 0 ? "mt-3" : ""}`}>
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>

                <div className="mb-16">
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold">Shipping & Return Policies</h2>
                    </div>

                    <div className="prose max-w-none">
                        <section className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">SHIPPING POLICY</h1>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    Heartland Shoppes offers free shipping on orders over $125.00 (before tax and after discounts), valid for
                                    Canadian and US orders only.
                                </p>
                                <p>
                                    We also offer local pickup. Once order is complete we will be in touch as to pick up location and
                                    instructions.
                                </p>
                                <p>
                                    Please note that Heartland Shoppes, is not responsible for shipping delays once your order has left our
                                    warehouse and is in the hands of the courier. We ship Monday through Friday (excluding weekends and
                                    holidays), and orders typically take 1-7 business days to process.
                                </p>
                                <p>
                                    Once your order ships, you will receive a tracking number via email. Please allow up to 24 hours for the
                                    tracking information to update.
                                </p>
                                <p>
                                    If a package is marked as delivered by the courier to the correct address as per the tracking information
                                    you receive, Heartland Shoppes cannot accept responsibility for any loss. Unfortunately, we do not offer
                                    replacements or refunds for orders confirmed delivered. We recommend reaching out to the courier directly
                                    for further assistance.
                                </p>
                                <p>
                                    In the event that your order is undeliverable or returned to sender due to inaccurate or incomplete shipping
                                    information, please note that shipping fees are non-refundable.
                                </p>
                                <p>Please note all customers are responsible for all duties and taxes on international shipments.</p>
                            </div>
                        </section>

                        <div className="border-t border-gray-200 my-8"></div>

                        <section>
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">RETURN/EXCHANGE POLICY</h1>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    Due to customization of our items, all sales are final. A final draft will be sent out to you for your
                                    approval and once you have accepted it, the article will go into production. If you notice an error please
                                    contact us as soon as possible, to see if it can be corrected. Once your item is complete, it cannot be
                                    corrected.
                                </p>

                                <p>The following items are not eligible for return or exchange:</p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Vendor Gifts with Purchase</li>
                                    <li>Original Shipping Charges</li>
                                    <li>Items that are not purchased directly through our website</li>
                                </ul>

                                <p>
                                    Please note that the cost of doing a return and/or exchange is the responsibility of the customer. All
                                    orders are shipped from Canada and must be returned to Canada as well. Heartland Shoppes does not cover the
                                    cost of doing returns and/or exchange.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Contact Section */}
                <section className="pt-16 pb-4 border-t border-gray-200 mt-16" id="contact">
                    <div className="bg-muted rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-6 border-b border-gray-200 pb-2">Contact Me</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-primary">Get In Touch</h3>
                                <p className="text-muted-foreground mb-6">
                                    Have questions about my products or interested in custom orders? Feel free to reach out!
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Mail className="w-5 h-5 mr-3 text-primary" />
                                        <span>heartlandshoppes@gmail.com</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 mr-3 text-primary" />
                                        <span>Medicine Hat, Alberta</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-background rounded-lg p-6 shadow-sm">
                                <h3 className="text-xl font-semibold mb-4 text-primary">Send a Message</h3>
                                <form className="space-y-4" onSubmit={sendMessage}>
                                    <div>
                                        <label htmlFor="contactName" className="block text-sm font-medium text-muted-foreground mb-1">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="contactName"
                                            value={message.name}
                                            onChange={(e) => handleChangeMessage('name', e.target.value)}
                                            className="w-full bg-muted/50 border border-input rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contactEmail" className="block text-sm font-medium text-muted-foreground mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="contactEmail"
                                            value={message.email}
                                            onChange={(e) => handleChangeMessage('email', e.target.value)}
                                            className="w-full bg-muted/50 border border-input rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contactMessage" className="block text-sm font-medium text-muted-foreground mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            id="contactMessage"
                                            rows={4}
                                            value={message.message}
                                            onChange={(e) => handleChangeMessage('message', e.target.value)}
                                            className="w-full bg-muted/50 border border-input rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                        ></textarea>
                                    </div>
                                    <button
                                        type={messageSent ? "button" : "submit"}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
                                    >
                                        {messageSent ? 'Message Sent' : 'Send Message'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}





