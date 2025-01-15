document.addEventListener("DOMContentLoaded", () => {
    const addReviewButton = document.getElementById("add-review-btn");
    const cancelButton = document.getElementById("cancel-review-btn");
    const userId = document.getElementById("user-id").value;
    const formContainer = document.getElementById("review-form");
    const reviewForm = document.querySelector("form[action='/api/reviews']");

    formContainer.addEventListener("submit", async(event) =>{
        event.preventDefault();
        const productId = addReviewButton.getAttribute("product-id");
        const rating = document.getElementById("review-rating").value;
        const comment = document.getElementById("review-comment").value;
        try{
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: userId,
                    product_id: productId,
                    rating: rating,
                    comment: comment,
                }),
            });
            const result = await response.json();
            if(response.ok){
                alert(result.message + "\nYour review will be processed soon.");
                toggleForm();
                changeReviewPage(1);// reviewsChangePageAJAX.js must be included before this file
            } else {
                alert(result.message);
            }
        } catch(error){
            console.error("Error adding review:", error);
            alert("Error adding review");
        }
    })

    addReviewButton.addEventListener("click", () => {
        if(userId == ""){
            window.location.href = "/login"; 
            return;
        }
        formContainer.classList.toggle('hidden');
    })

    cancelButton.addEventListener("click", () => {
        toggleForm();
    })

    function toggleForm(){
        formContainer.classList.toggle('hidden');
        reviewForm.reset();
    }
});

  