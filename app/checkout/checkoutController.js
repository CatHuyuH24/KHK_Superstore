const checkoutService = require('./checkoutService');
const profileService=require('../profile/profileService');
const cartService=require('../cart/cartService');
const { calculateDiscountedPrice } = require('../Utils/discountedPriceUtils');
const { StatusCodes } = require('http-status-codes');
const e = require('connect-flash');

const renderCheckoutPage=async (req,res)=>{
    try{
        const user_id = res.locals.user ? res.locals.user.id : null;
        const {products, totalSum, totalDiscount, totalPay} = await checkoutService.getProductInCartByUserIdToOrder(user_id);
        const userProfile = await profileService.getUserProfile(user_id);

        const response = {
            title: 'Order Page - Superstore',
            error: false,
            products: products,
            totalSum: totalSum,
            totalDiscount: totalDiscount,
            user_id:user_id,
            totalPay: totalPay,
            userProfile:userProfile
          };

        
         return res.render('checkout', response);
    }catch(error){
        console.error('Error rendering order page:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
}

async function SaveOrderToDB(req,res){
    try{
        const userID = res.locals.user ? res.locals.user.id : null;
        if (!userID) {
            return res.redirect('/login');
        }
        let products = [];
        if (req.body.products) {
          try {
            products = JSON.parse(req.body.products);
          } catch (error) {
            console.error('Error parsing products JSON:', error);
            return res.status(400).send('Invalid JSON format.');
          }
        }
        if(products.length === 0){
          return res.redirect('/');
        }


        const {address_line} = req.body;
     

        const totalPay = parseFloat(req.body.totalPay);
        
        const orderInfo = await checkoutService.createNewOrder(userID,totalPay,address_line);
        try {
          for (const product of products) {
            await checkoutService.createOrderDetail(orderInfo.order_id, product.id, product.quantity,product.price, product.name);
            cartService.deleteProductInCart(product.id,userID);
          }
        
        } catch (error) {
          // should also delete the related order details by 'ON DELETE CASCADE'
          const deleteOrder = await checkoutService.deleteOrder(orderInfo.order_id);
          await checkoutService.deleteOrder(orderInfo.order_id);
          const {products, totalSum, totalDiscount, cartTotalPay} = await cartService.getProductInCartByUserId(userID);
          const cartProducts = products;
          
          const response = {
              title: 'Cart Page - Superstore',
              error: false,
              products: cartProducts,
              totalSum: totalSum,
              totalDiscount: totalDiscount,
              user_id: userID,
              totalPay: cartTotalPay,
              errorMessage: error.message,
            };

            return res.render('cart', response);//with error message
          }

          return res.redirect(`/checkout/orderSuccess?order_code=${orderInfo.order_code}`);

    }catch(error){
        console.error('Error save customer order:',error);
    }
}

async function renderOrderSuccessPage(req,res){

    const userID = res.locals.user ? res.locals.user.id : null;
    if (!userID) {
        return res.redirect('/login');
    }
    const orderCode = req.query.order_code;
    

    const result=await checkoutService.findOrderWithDetails(orderCode,userID);
    const Order=result.order;
    let orderDetail=[];
    orderDetail=result.details;
    const response={
      title:"Order Success",
      Order:Order,
      orderCode:orderCode,
      orderDetail:orderDetail,
    };
    res.render('orderSuccess',response);
}

async function renderOrderListPage(req, res) {
  try {
    let status = req.query.status || 'All';
    const search = req.query.search || '';
   
    const userID = res.locals.user ? res.locals.user.id : null;
    if (!userID) {
        return res.redirect('/login');
    }

    const { orderList } =
      await checkoutService.getAllOrderAndOrderItemByUserID(
        status,
        search,
        userID
      );
    
    let  typeofStatus=['Pending', 'Confirmed', 'Delivered', 'Completed', 'Canceled', 'In Transit'];
    const response = {
      title: 'Order List Page',
      orderList: orderList,
      user_id: userID,
      typeOfFoods:typeofStatus,
    };



    if (req.xhr) {
      return res.json(response);
    }

    return res.render('orderList', response);
  } catch (error) {
    console.error('Error rendering order list page:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

module.exports = {
    renderCheckoutPage,
    SaveOrderToDB,
    renderOrderSuccessPage,
    renderOrderListPage
};