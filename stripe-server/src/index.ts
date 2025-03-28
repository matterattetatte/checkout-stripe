import dotenv from 'dotenv';
import cors from 'cors';
import { ResultSetHeader, RowDataPacket } from "mysql2";
import express, { Request, Response } from 'express';
import { Stripe } from 'stripe';
import { IOrder } from './models/IOrder'
import { IOrderItem } from './models/IOrderItem'
import { db } from './config/db'

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

app.post("/orders", async (req: Request, res: Response) => {
  const { customer_id, payment_status, payment_id, order_status, order_items }: IOrder = req.body;
  
  try {
    const sql = `
      INSERT INTO orders (customer_id, total_price, payment_status, payment_id, order_status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const createOrderItem = async (data: IOrderItem) => {
      const {order_id, product_id, product_name, quantity, unit_price} = data;
      try {
        const sql = `
          INSERT INTO order_items (
            order_id, 
            product_id, 
            product_name, 
            quantity, 
            unit_price 
          ) VALUES (?, ?, ?, ?, ?)
        `;
        const params = [order_id, product_id, product_name, quantity, unit_price]
        await db.query<ResultSetHeader>(sql, params)
      } catch(error) {
        throw new Error;
      }
    }

    const totalPrice = order_items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
    const params = [customer_id, totalPrice, payment_status, payment_id, order_status]
    const [result] = await db.query<ResultSetHeader>(sql, params)
    if (result.insertId) {
      const order_id: number = result.insertId;
      const orderItems = req.body.order_items;
      for (const orderItem of orderItems) {
        const data = {...orderItem, order_id}
        await createOrderItem(data)
      };
    }

    res.status(201).json({message: 'Order created', id: result.insertId});
  } catch (error: unknown) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error })
  }
})

app.patch("/orders/:id", async (req: Request, res: Response) => {
  const id: string = req.params.id;
  const { payment_status, payment_id, order_status }: IOrder = req.body;
  
  try {
    const sql = `
      UPDATE orders 
      SET payment_status = ?, payment_id = ?,order_status = ?
      WHERE id = ?
    `;
    const params = [payment_status, payment_id, order_status, id];
    const [result] = await db.query<ResultSetHeader>(sql, params)

    result.affectedRows === 0
      ? res.status(404).json({message: 'Order not found'})
      : res.json({ message: 'Order updated' })
    
  } catch(error) {
    res.status(500).json({error: error })
  }
})

app.get('/orders/payment/:id', async (req: Request, res: Response) => { 
  // TODO: SHOULD I GET ANY DATA FROM THE STRIPE API, OR USE THE DATA FROM MY DATABASE??
  const [order] = await db.query(`SELECT * FROM orders WHERE payment_id = ?`, [req.params.id])
  const [order_items] = await db.query(`SELECT * FROM order_items WHERE order_id = ?`, [order[0].id])
  const [customer] = await db.query(`SELECT * FROM customers WHERE id = ?`, [order[0].customer_id])

  res.json({ order_items, order: order[0], customer: customer[0] })
})

app.get('/customers/email/:email', async (req: Request, res: Response) => {
  const { email } = req.params
  let [customer] = await db.query<RowDataPacket[]>(`SELECT * from customers where email = ?`, [email])

  if (customer.length === 0) {
    const [result] = await db.query<ResultSetHeader>(`INSERT INTO customers(email) values (?)`, [email])

    res.json({ id: result.insertId })
  } else { 
    res.json({ id: customer[0].id })
  }
})

interface InitSession {
  cart: {
    product: { name: string }
    quantity: number
   }[]
  order_id: string
}

app.post('/stripe/create-checkout-session-hosted', async (req: Request, res: Response) => {
  const { cart, order_id } = req.body as InitSession;

  const line_items = cart.map(({ product, quantity }) => ({
    price_data: {
      currency: 'SEK',
      product_data: {
        name: product.name
      },
      unit_amount: 5 * 100,
    },
    quantity,
  }))

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: 'payment',
    success_url: 'http://localhost:5173/order-confirmation?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'http://localhost:5173/checkout',
    client_reference_id: order_id,
  });


  res.json({ checkout_url: session.url, session_id: session.id });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
})
