const Orders = require("../models/Order");
const Product = require("../models/Product");

const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { checkPermissions } = require("../utils");
const Order = require("../models/Order");

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = "someRandomValue";
  return { client_secret, amount };
};

//create order
const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError("No cart item provided");
  }

  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError("please provide tax");
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product });

    if (!dbProduct) {
      throw new CustomError.BadRequestError(
        `No product with id :${item.product}`
      );
    }
    const { name, price, image, _id } = dbProduct;
    console.log(name, price, image);
    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };

    //add item to order

    orderItems = [...orderItems, singleOrderItem];

    //calculate sub total

    subtotal += item.amount * price;
  }
  //calculat total

  const total = tax + shippingFee + subtotal;

  //get clinet secret

  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: "usd",
  });
  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
  });
  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.client_secret });
};

//get all order
const getAllOrders = async (req, res) => {
  const orders = await Order.find({});
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

//get single order
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.BadRequestError(`No product with id :${orderId}`);
  }
  checkPermissions(req.user, order.user);
  res.status(StatusCodes.OK).json({ order });
};

//get current user
const getCurrentUserOrders = async (req, res) => {
  const order = await Order.find({ user: req.user.iserId });
  res.status(StatusCodes.OK).json({ order, count: order.length });
};

//update user
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntentId } = req.body;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.BadRequestError(`No product with id :${orderId}`);
  }
  checkPermissions(req.user, order.user);

  order.paymentIntentId = paymentIntentId;
  order.status = "paid";
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
