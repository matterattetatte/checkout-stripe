import { useEffect, useState } from 'react'

const urlParams = new URLSearchParams(window.location.search)
const id = urlParams.get('session_id')

export const OrderConfirmation = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderInfo, setOrderInfo] = useState<any>()
  const [fetched, setFetched] = useState(false)
  
  useEffect(() => {
    if (!fetched) {
      setFetched(true)
      fetch(`http://localhost:3000/orders/payment/${id}`).then((r) => r.json()).then((data) => {
        setOrderInfo(data)
        
        fetch(`http://localhost:3000/orders/${data.order.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ payment_status: "Paid", payment_id: id, order_status: "Received" })
        }).then((r) => r.json())
        
        localStorage.clear()
      }) 
    }
  }, [fetched])

  console.log(orderInfo)

  if (!orderInfo) return <div>Loading...</div>

  const { customer, order, order_items } = orderInfo
  return (
    <>
    <div>Bekräftelse</div>
     {orderInfo && <div>
      <h2>Checkout Session</h2>
        <p>Kund: {customer.email}</p>
        <p>Pris totalt: {order.total_price} SEK</p>
        <p>Status: {order.payment_status}</p>
        <hr />
        <p>Orderrader</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {order_items.map((item: any) => (
          <div key={item.id}>
            <strong>{item.product_name}</strong>
            <br />
            <span>Antal {item.quantity}</span>
            <br />
            <span>Pris totalt denna produkt: {Number(item.unit_price) * item.quantity}</span>
          </div>
        ))}
      </div>}
    </>
  )
}
