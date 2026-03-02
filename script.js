document.addEventListener('DOMContentLoaded',() => {
    
    const progress = document.querySelector('.progress');
    const stepIndicators = document.querySelectorAll('.progress-container li');
    const firstButton = document.querySelector('.first-btn');
    const nextButton = document.querySelector('.next-btn');
    const submitButton = document.querySelector('.submit-btn');

    document.documentElement.style.setProperty('--steps', stepIndicators.length);

    let currentStep = 0;

    setInterval(() => {

        currentStep++;

        if(currentStep > stepIndicators.length - 1){
            currentStep = 0
        }

        let width = currentStep / (stepIndicators.length - 1);
        progress.style.transform = `scaleX(${width})`;

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle("current", currentStep === index)
            indicator.classList.toggle("done", currentStep > index)
        })

    }, 2000);

});