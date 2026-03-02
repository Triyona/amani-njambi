document.addEventListener('DOMContentLoaded',() => {
    
    const progress = document.querySelector('.progress');
    const stepIndicators = document.querySelectorAll('.progress-container li');
    const prevButton = document.querySelector('.prev-btn');
    const nextButton = document.querySelector('.next-btn');
    const submitButton = document.querySelector('.submit-btn');

    document.documentElement.style.setProperty('--steps', stepIndicators.length);

    let currentStep = 0;

    const updateProgress = () => {
        let width = currentStep / (stepIndicators.length - 1);
        progress.style.transform = `scaleX(${width})`;

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle("current", currentStep === index);
            indicator.classList.toggle("done", currentStep > index);
        });
    };

    prevButton.addEventListener("click", (e) => {
        e.preventDefault(); //prevent form submission

        if (currentStep < 2){
            currentStep++;
            updateProgress();
        }
    });

    nextButton.addEventListener("click", (e) => {
        e.preventDefault(); //prevent form submission

        if (currentStep < 3){
            currentStep++;
            updateProgress();
        }
    });

});