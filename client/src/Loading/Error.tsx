import React, { useEffect, useState } from "react";

interface ErrorProps {
    setError?: React.Dispatch<React.SetStateAction<string>>,
    message: string
}
export default function Error({ setError, message }: ErrorProps) {
    return <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full no-blur z-20 my-2">
        <SimpleErrorNotification message={message} setError={setError ? setError : undefined} />
    </div>
}

interface SimpleErrorNotificationProps {
    setError?: React.Dispatch<React.SetStateAction<string>>,
    message: string,
    duration?: number
}

const SimpleErrorNotification = ({ setError, message, duration = 25000 }: SimpleErrorNotificationProps) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    useEffect(() => {
        if (visible) {
            const originalStyle = document.body.style.overflow;

            // Apply blur to everything except the navbar
            document.body.classList.add('blur-background');

            return () => {
                // Clean up when component unmounts or search becomes false
                document.body.classList.remove('blur-background');
                document.body.style.overflow = originalStyle;
            };
        }
    }, [visible])

    const handleCloseError = () => {
        setVisible(false)
        if (setError) {
            setError('')
        }
    }

    if (!visible) return null;

    return (
        <div className="mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md w-[50%]  z-20">
            <div className="flex z-20">
                <div className="flex-shrink-0">
                    <svg onClick={handleCloseError} className="h-5 w-5 text-red-400 cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex flex-col ml-3">
                    <p className="text-sm text-red-700">{message}</p>
                    <p className="text-sm text-red-700 font-bold">Please contact site administrator if issue persists. Thank you</p>
                </div>
            </div>
        </div>
    );
};