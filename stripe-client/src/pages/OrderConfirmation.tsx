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
  // Example of orderInfo structure;
  // { "order_items": [{ "id": 1, "order_id": "1", "product_id": 1, "product_name": "Ballong", "quantity": 1, "unit_price": "100.00" }, { "id": 2, "order_id": "1", "product_id": 2, "product_name": "Skor", "quantity": 5, "unit_price": "987.00" }, { "id": 7, "order_id": "1", "product_id": 1, "product_name": "Ballong", "quantity": 6, "unit_price": "100.00" }, { "id": 8, "order_id": "1", "product_id": 2, "product_name": "Skor", "quantity": 1, "unit_price": "987.00" }], "order": { "id": 1, "customer_id": 7, "total_price": "1587.00", "payment_status": "Paid", "payment_id": "cs_test_b1CBWBW2GpGijl1L4guULqU9sVcQJ9dCikAP4mzgbcksnEu6p6L89ya2Pw", "order_status": "Received", "created_at": "2025-03-28T20:06:05.000Z", "updated_at": "2025-03-28T20:08:16.000Z" }, "customer": { "id": 7, "email": "hihi@email.com" } }
  return (
    <>
    <div>Bekräftelse</div>
     {orderInfo && <div>
      <h2>Checkout Session</h2>
        <p>Kund: {customer.email}</p>
        <p>Pris totalt: {order.total_price} SEK</p>
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
