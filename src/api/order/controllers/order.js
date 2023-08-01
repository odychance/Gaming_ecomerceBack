'use strict';
const stripe = require("stripe")("sk_test_51N091RJibCHe30CgLyi8Jw1qUi4WWfzqp5AbQH33hbKEgIxm9QWSsKPISIcAefyfBFM2UUWLk0CvGqQwnz9LvPQt00Yc8WMbEW")

 function calcDiscountPrice(price, discount) {
    if(!discount) return price

     const discountAmount = ( price * discount ) / 100
     const result = price - discountAmount

     return result.toFixed (2)
}

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
    async paymentOrder(ctx) {
        // ctx.body = "Payment and order successful."
        const { token, products, idUser, addressShipping } = ctx.request.body

        let totalPayment = 0
        products.forEach((product) => {
            const priceTemp = calcDiscountPrice(
                product.attributes.price,
                product.attributes.discount
            )

            totalPayment += Number(priceTemp) * product.quantity
        })

        const charge = await stripe.charges.create({
            amount: Math.round(totalPayment * 100),
            currency: "mxn",
            source:  token.id,
            description: `User ID = ${idUser}`
        })

        const data = {
            products,
            user: idUser,
            totalPayment,
            idPayment: charge.id,
            addressShipping
        }

        const model = strapi.contentTypes["api::order.order"]
        const validData = await strapi.entityValidator.validateEntityCreation(
            model,
            data
        )

        const entry = await strapi.db.query("api::order.order").create( { data: validData } )
        return entry
    }
}));

