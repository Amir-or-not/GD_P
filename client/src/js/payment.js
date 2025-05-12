export default function paymentScript() {
    const radioButtons = document.querySelectorAll('input[name="payment"]');
    const cardForm = document.querySelector(".card-payment-form");
    const cryptoInfo = document.querySelector(".crypto-info");
    const cashInfo = document.querySelector(".cash-info");
  
    const handlePaymentChange = (e) => {
      const value = e.target.value;
      if (cardForm) cardForm.style.display = value === "card" ? "flex" : "none";
      if (cryptoInfo) cryptoInfo.style.display = value === "crypto" ? "block" : "none";
      if (cashInfo) cashInfo.style.display = value === "cash" ? "block" : "none";
    };
  
    radioButtons.forEach((radio) => {
      radio.addEventListener("change", handlePaymentChange);
    });
  
    // Trigger default selection
    const checkedRadio = document.querySelector('input[name="payment"]:checked');
    if (checkedRadio) handlePaymentChange({ target: checkedRadio });
  
    // Cleanup
    return () => {
      radioButtons.forEach((radio) => {
        radio.removeEventListener("change", handlePaymentChange);
      });
    };
  }
  