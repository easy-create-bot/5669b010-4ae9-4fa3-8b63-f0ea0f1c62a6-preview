import { useState } from "react";
import Drawer from "./Navbar/Drawer";

export default function Settings() {
    return <div className="h-screen">
        <Drawer />
        <Dashboard />
    </div>
}

enum DashboardOptions {
    account,
    orderHistory
}

interface DisplayProps {
    options: DashboardOptions
}

function DisplayOptions({ options }: DisplayProps) {
    if (options == DashboardOptions.account) {
        return <Account />
    } else if (options == DashboardOptions.orderHistory) {
        return <OrderHistory />
    }
}

function Dashboard() {
    const [option, setOption] = useState<DashboardOptions>(DashboardOptions.account)

    return <div className="flex w-full h-[90%] items-center justify-center md:my-4">
        <div className="flex flex-col w-[90%] h-fit shadow-black shadow-md rounded-lg">
            <DashboardNav setOption={setOption} />
            <DisplayOptions options={option} />
        </div>
    </div>
}

interface DashboardNavProps {
    setOption: (options: DashboardOptions) => void
}

function DashboardNav({ setOption }: DashboardNavProps) {
    return <div className="flex flex-row flex-wrap w-full h-fit items-center space-x-6 text-xl pl-2 sm:pl-6 py-2 border-b-2 border-black font-button font-semibold">
        <div className="flex flex-col cursor-pointer" onClick={() => setOption(DashboardOptions.account)}>
            <p>Account</p>
        </div>
        <div className="flex flex-col cursor-pointer" onClick={() => setOption(DashboardOptions.orderHistory)}>
            <p>Order History</p>
        </div>
    </div>
}

function Account() {
    return <div className=" h-full flex flex-col pl-4 sm:pl-8 md:pl-12 py-2 sm:py-4 w-[90%]">
        <div className="flex flex-row flex-wrap w-full items-center text-xl md:text-2xl font-regular sm:space-x-2">
            <p className="">Email:</p>
            <p className="">Jace@gmail.com</p>
        </div>
        <div className="flex flex-row flex-wrap items-center my-1 text-lg sm:text-xl space-x-2 font-regular">
            <p>Recent order: </p>
            <p className="underline underline-offset-0.5">#000007</p>
        </div>
        <div className="flex flex-col items-end space-y-2 my-2">
            <button className="bg-pink-200 text-white p-1 rounded-lg text-lg sm:text-xl font-button font-bold">Change Password</button>
            <button className="bg-pink-200 text-white p-1 rounded-lg text-lg sm:text-xl font-button font-bold">Delete Account</button>
        </div>
    </div>
}

function OrderHistory() {
    return <div className="flex flex-col pl-2 sm:pl-10 h-fit">
        <RecentOrder />
        <PastOrders />
        <Support />
    </div>
}

function Order() {
    return <div className="flex flex-col sm:pl-2">
        <div className="font-regular">
            <p>Order #</p>
            <p>Date</p>
            <p>Total Amount</p>
            <p>Tracking Number & Status</p>
        </div>
    </div>
}

function RecentOrder() {
    return <div className="flex flex-col py-2 h-fit">
        <h3 className="text-xl font-headerFont">Recent order: #7777</h3>
        <Order />
    </div>
}

function PastOrders() {
    const orders = [1, 2, 3, 4, 5, 6]
    return <div className="h-1/2">
        <h3 className="text-2xl font-headerFont">Order History</h3>
        <div className="flex flex-row border-black border-2 h-[90%] w-[90%] items-center space-x-12 sm:pr-6 pr-2 pl-2 sm:pl-6 overflow-x-scroll py-2">
            {orders.map((order, index) =>
                <Order key={index} />
            )}
        </div>
    </div>
}

function Support() {
    return <div className="py-2 my-4 font-button font-bold md:text-lg">
        <p>Need to reach out about something else? Send us an email</p>
        <p>heartlandshoppes@email.com</p>
    </div>
}