import { useEffect, useState } from "react"

const urlParams = new URLSearchParams(window.location.search)
const id = urlParams.get("session_id")

export const OrderConfirmation = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orderInfo, setOrderInfo] = useState<any>()
    const [fetched, setFetched] = useState(false)

    useEffect(() => {
        if (!fetched) {
            setFetched(true)
            fetch(`http://localhost:3000/orders/payment/${id}`)
                .then((r) => r.json())
                .then((data) => {
                    setOrderInfo(data)

                    fetch(`http://localhost:3000/orders/${data.order.id}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ payment_status: "Paid", payment_id: id, order_status: "Received" }),
                    }).then((r) => r.json())

                    localStorage.clear()
                })
        }
    }, [fetched])

    if (!orderInfo) return <div>Loading...</div>

    const { customer, order, order_items } = orderInfo
    return (
        <>
            <div>Confirmation</div>
            {orderInfo && (
                <div>
                    <h2>Checkout Session</h2>
                    <p>
                        <strong>Customer:</strong> {customer.firstname} {customer.lastname}
                    </p>
                    <p>
                        <strong>Phone:</strong> {customer.phone}
                    </p>
                    <p>
                        <strong>Email:</strong> {customer.email}
                    </p>
                    <p>
                        <strong>Address:</strong> {customer.street_address} {customer.postal_code} {customer.city}, {customer.country}
                    </p>
                    <p>
                        <strong>Total price:</strong> {order.total_price} SEK
                    </p>
                    <p>
                        <strong>Status:</strong> {order.payment_status}
                    </p>
                    <hr />
                    <p>Order rows</p>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {order_items.map((item: any) => (
                        <div key={item.id}>
                            <strong>{item.product_name}</strong>
                            <br />
                            <span>Amount {item.quantity} pcs</span>
                            <br />
                            <span>Total price for this product: {Number(item.unit_price) * item.quantity} kr</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}
