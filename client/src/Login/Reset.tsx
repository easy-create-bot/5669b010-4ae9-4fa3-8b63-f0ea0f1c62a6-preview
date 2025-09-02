import axios, { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Error from "../Loading/Error"
import logo from '../assets/LOGO.png'
const apiUrl = import.meta.env.VITE_API_URL;

export default function Reset() {
    const params = useParams()
    const { token } = params

    const [valid, setValid] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate()

    useEffect(() => {
        const verifyToken = async () => {
            try {
                await axios.get(`${apiUrl}/auth/reset/verify?token=${token}`)
                setValid(true)
            } catch (error) {
                navigate('/', { replace: true })
                if (error instanceof AxiosError && error.response) {
                    setError(error.response.data)
                }
            }
        }
        verifyToken()
    }, [])


    return (
        <>
            {error && <Error message={error} />}
            {valid && <div className="flex w-full items-center justify-center h-screen">
                <ResetForm setError={setError} />
            </div>}
        </>
    );
}

interface ResetFormProps {
    setError: React.Dispatch<React.SetStateAction<string>>
}

function ResetForm({ setError }: ResetFormProps) {
    const params = useParams()
    const { token } = params

    const [password, setPassword] = useState("")
    const [reEnteredPass, setReEnteredPass] = useState("")


    const navigate = useNavigate()

    const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        console.log('running')
        if (password !== reEnteredPass) {
            setError('Passwords must match')
            return
        }

        try {
            const res = await axios.post(`${apiUrl}/auth/reset/credentials`, { token: token, password: password })
            console.log(res)
            navigate('/', { replace: true })
        } catch (error) {
            console.log(error)
            if (error instanceof AxiosError && error.response) {
                setError(error.response.data)
            }
        }
    }
    return <div className="flex flex-col w-fit md:w-[40%] h-fit rounded-sm justify-center items-center py-6 shadow-gray-600 shadow-md">
        <img src={logo} className="w-40 h-40 rounded-full mb-2"></img>
        <h3 className="font-headerFont text-2xl">Heartland Shoppes</h3>
        <form className="flex flex-col my-6 w-full space-y-1 items-center" onSubmit={handlePasswordChange}>
            <div className="flex flex-col w-[70%] mx-auto">
                <p className="text-lg font-regular">Password:</p>
                <input type="password" className="border-black border-2 w-full pl-1 h-8 rounded-sm" value={password} onChange={(e) => setPassword(e.target.value)}></input>
            </div>
            <div className="flex flex-col w-[70%] mx-auto">
                <p className="text-lg font-regular">Re-enter Password:</p>
                <input type="password" className="border-black border-2 w-full pl-1 h-8 rounded-sm" value={reEnteredPass} onChange={(e) => setReEnteredPass(e.target.value)}></input>
            </div>
            <button className="my-4 bg-[#f8b4c4] font-button font-semibold w-fit p-1.5 rounded-lg text-lg text-white" type="submit">Change Password</button>
        </form >
    </div >
}