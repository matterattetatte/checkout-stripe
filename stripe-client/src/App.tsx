import { FormEvent, useState } from 'react'
import './App.css'
import { OrderConfirmation } from './pages/OrderConfirmation'

const { href } = window.location

function App() {
  const [cart, setCart] = useState([
    {
      product: {
        id: 1,
        name: "Ballong",
        price: 100,
      },
      quantity: 1
    },
    {
      product: {
        id: 2,
        name: "Skor",
        price: 987,
      },
      quantity: 5
    }
  ])
  const [formData, _setFormData] = useState(JSON.parse(localStorage.formData || '{}'))

  const setFormData = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    }

    localStorage.formData = JSON.stringify(newFormData)

    _setFormData(newFormData)
  }

  const changeQty = (id: number, quantity: number) => {
    setCart(cart.map((item) => {
      if (item.product.id === id) {
        const totalQuantity = item.quantity + quantity
        return { ...item, quantity: totalQuantity > 0 ? totalQuantity : 1 }
      }

      return item;
    }))
  }

  const removeProduct = (id: number) => {
    setCart(cart.filter(({ product }) => product.id !== id))
  }



  const getCustomer = async () => {
    // TODO: ERROR HANDLING MAYBE
    const response = await fetch(`http://localhost:3000/customers/email/${formData.email}`).then((r) => r.json())

    return response.id
  }


  const createOrder = async (customerID: string) => {
    const response = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: customerID,
        payment_status: "Unpaid",
        payment_id: "",
        order_status: "Pending",
        order_items: cart.map(({ product, quantity }) => ({ product_id: product.id, product_name: product.name, quantity, unit_price: product.price })),
      })
    }).then((r) => r.json())

    return response.id
  }

  const updateOrder = async (orderID: string, sessionID: string) => {
    const response = await fetch(`http://localhost:3000/orders/${orderID}`, {
      method: 'PATCH',  
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payment_status: "Unpaid", payment_id: sessionID, order_status: "Pending" })
    }).then((r) => r.json())

    return response.id
  }

  const   handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const customerID = await getCustomer()
    const orderID = await createOrder(customerID)

    try {
      const response = await fetch('http://localhost:3000/stripe/create-checkout-session-hosted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart,
          order_id: orderID
        })
      })

      const data = await response.json()
      await updateOrder(orderID, data.session_id)

      window.location.href = data.checkout_url
    } catch (error) {
      console.log(error)
    }
  }

  if (href.includes('order-confirmation')) {
    return <OrderConfirmation />
  }

  if (cart.length === 0) {
    return (
      <>
        <h1>Tom varukorg</h1>
        <p>Du kan inte checka ut!!!</p>

        <button onClick={() => window.location.reload()}>Ladda om</button>
      </>
    )
  }

  return (
    <>
      <h1>Checkout (Hosted)</h1>

      <h3>Varukorg</h3>
      <div>

        <div>
          {cart.map(({ product, quantity }) => (
            <div key={product.id}>
              {product.name}, Antal {quantity}, Pris: {quantity * product.price}
              <button onClick={() => changeQty(product.id, 1)}>+</button>
              <button onClick={() => changeQty(product.id, -1)}>-</button>
              <button onClick={() => removeProduct(product.id)}>Ta bort 🗑️</button>
            </div>
          ))}
        </div>

        <hr />
        <p>

          Totalt antal produkter: {cart.length}
        </p>
        <p>

          Pris totalt: {cart.reduce((acc, { product: { price }, quantity }) => (acc + price * quantity), 0)} kr
        </p>
      </div>

      <form action="" onSubmit={handleSubmit}>

        <h3>Kund info (formulär)</h3>
        <p>
          <input placeholder='email' value={formData.email} onChange={(e) => setFormData('email', e.target.value )} ></input>

        </p>

      <h3>Betalning</h3>
      <button>Till betalning</button>
      </form>
    </>
  )
}

export default App
