function moveToCheckout(totalPay){
    if(totalPay <= 0){
        alert("You're MISSING OUT!\nExplore our WONDERFUL items!");
        return;
    } else {
        window.location.href = '/checkout';
    }
}
