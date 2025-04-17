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
    let response = await fetch(`http://localhost:3000/customers/email/${formData.email}`).then((r) => r.json())

    if (!response.id) {
      response = await fetch('http://localhost:3000/customers', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
       },
       body: JSON.stringify(formData) }).then((r) => r.json())

       if (!response.id) {
          throw new Error(response.error)
       }
    }

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    try {
      const customerID = await getCustomer()
      const orderID = await createOrder(customerID)
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
      alert((error as Error).message)
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

      <h3>Cart</h3>
      <div>

        <div>
          {cart.map(({ product, quantity }) => (
            <div key={product.id}>
              {product.name}, Quantity {quantity}, Price: {quantity * product.price}
              <button onClick={() => changeQty(product.id, 1)}>+</button>
              <button onClick={() => changeQty(product.id, -1)}>-</button>
              <button onClick={() => removeProduct(product.id)}>Ta bort 🗑️</button>
            </div>
          ))}
        </div>

        <hr />
        <p>

          Total amount of products: {cart.length}
        </p>
        <p>

          Total price: {cart.reduce((acc, { product: { price }, quantity }) => (acc + price * quantity), 0)} kr
        </p>
      </div>

      <form action="" onSubmit={handleSubmit}>

        <h3>Customer info</h3>
        <p className="checkout-form">
          <input placeholder='Name' value={formData.firstname} onChange={(e) => setFormData('firstname', e.target.value )} ></input>
          <input placeholder='Last Name' value={formData.lastname} onChange={(e) => setFormData('lastname', e.target.value )} ></input>
          <input placeholder='Email' value={formData.email} onChange={(e) => setFormData('email', e.target.value )} ></input>
          <input placeholder='Phone' value={formData.phone} onChange={(e) => setFormData('phone', e.target.value )} ></input>
          <input placeholder='Street Address' value={formData.street_address} onChange={(e) => setFormData('street_address', e.target.value )} ></input>
          <input placeholder='Postal Code' value={formData.postal_code} onChange={(e) => setFormData('postal_code', e.target.value )} ></input>
          <input placeholder='City' value={formData.city} onChange={(e) => setFormData('city', e.target.value )} ></input>
          <select value={formData.country} onChange={(e) => setFormData('country', e.target.value )} >
            <option value="">Country</option>
            <option value="Sweden">Sweden</option>
            <option value="Poland">Poland</option>
          </select>

        </p>

      <h3>Payment</h3>
      <button>To payment</button>
      </form>
    </>
  )
}

export default App
