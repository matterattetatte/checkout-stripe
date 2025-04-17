import { Request, Response } from "express";
import { db } from "../config/db";
import { STRIPE_SECRET_KEY } from "../constants/env";
const stripe = require('stripe')(STRIPE_SECRET_KEY);


interface InitSession {
    cart: {
      product: { name: string; price: number }
      quantity: number
     }[]
    order_id: string
}  

export const checkoutSessionHosted =  async (req: Request, res: Response) => {
    const { cart, order_id } = req.body as InitSession;
  
    const line_items = cart.map(({ product, quantity }) => ({
      price_data: {
        currency: 'SEK',
        product_data: {
          name: product.name
        },
        unit_amount: product.price * 100,
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
}

export const checkoutSessionEmbedded = async (req: Request, res: Response) => {
};

export const webhook = async (req: Request, res: Response) => {
};
