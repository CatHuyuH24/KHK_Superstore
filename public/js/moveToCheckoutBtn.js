function moveToCheckout(totalPay){
    if(totalPay <= 0){
        alert("YOUR ORDER IS EMPTY!\nEXPLORE OUR WONDERFUL PRODUCTS!");
        return;
    } else {
        window.location.href = '/checkout';
    }
}
