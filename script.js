document.addEventListener('DOMContentLoaded',() => {
    
    const progress = document.querySelector('.progress');
    const stepIndicators = document.querySelectorAll('.progress-container li');
    const firstButton = document.querySelector('.first-btn');
    const nextButton = document.querySelector('.next-btn');
    const submitButton = document.querySelector('.submit-btn');

    document.documentElement.style.setProperty('--steps', stepIndicators.length);

    let currentStep = 0;

    const updateButtons = () => {
        firstButton.style.display  = currentStep === 0 ? 'inline-block' : 'none';
        nextButton.style.display   = currentStep === 1 ? 'inline-block' : 'none';
        submitButton.style.display = currentStep === 2 ? 'inline-block' : 'none';
    };

    const updateProgress = () => {
        let width = currentStep / (stepIndicators.length - 1);
        progress.style.transform = `scaleX(${width})`;

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle("current", currentStep === index)
            indicator.classList.toggle("done", currentStep > index)
        })

        updateButtons();
    }

    //*event listeners

    firstButton.addEventListener('click', () => {
        currentStep++;
        updateProgress();
    });

    nextButton.addEventListener('click', () => {
        currentStep++;
        updateProgress();
    });

    submitButton.addEventListener('click', () => {
    currentStep = 0;     // reset to step 1
    updateProgress();    // update progress bar + buttons
    });

    // setInterval(() => {
    //     currentStep++;
    //     if(currentStep > stepIndicators.length - 1){
    //         currentStep = 0
    //     }
    // }, 2000);
});