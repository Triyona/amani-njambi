document.addEventListener('DOMContentLoaded',() => {
    
    const progress = document.querySelector('.progress');
    const stepsContainer = document.querySelector('.steps-container');
    const steps = document.querySelectorAll('.step');
    const stepIndicators = document.querySelectorAll('.progress-container li');
    const prevButton = document.querySelector('.prev-btn');
    const nextButton = document.querySelector('.next-btn');
    const submitButton = document.querySelector('.submit-btn');

    document.documentElement.style.setProperty('--steps', stepIndicators.length);

    let currentStep = 0;

    const updateProgress = () => {
        let width = currentStep / (stepIndicators.length - 1);
        progress.style.transform = `scaleX(${width})`;

        stepsContainer.style.height = steps[currentStep].offsetHeight + "px";

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle("current", currentStep === index);
            indicator.classList.toggle("done", currentStep > index);
        });
        
        steps.forEach((step, index) => {
            step.style.transform = `translateX(-${currentStep * 100}%)`;
            step.classList.toggle("current", currentStep === index);
        });

        updateButtons();
    };

    function updateButtons () {
        if (currentStep <= 0) {
            prevButton.style.display = 'block'; // Show the button
        } else {
            prevButton.style.display = 'none'; // Hide the button
        }
        if (currentStep === 1) {
            nextButton.style.display = 'block'; // Show the button
        } else {
            nextButton.style.display = 'none'; // Hide the button
        }
        if (currentStep === 2) {
            submitButton.style.display = 'block'; // Show the button
        } else {
            submitButton.style.display = 'none'; // Hide the button
        }
    };


    //*event listeners

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

    updateProgress();
});