document.addEventListener('DOMContentLoaded',() => {

    const progress = document.querySelector('.progress');
    const stepsContainer = document.querySelector('.steps-container');
    const steps = document.querySelectorAll('.step');
    const stepIndicators = document.querySelectorAll('.progress-container li');
    const findButton = document.querySelector('.find-btn');
    const continueButton = document.querySelector('.continue-btn');
    const submitButton = document.querySelector('.submit-btn');

    const acceptBtn = document.getElementById("ACCEPT");
    const declineBtn = document.getElementById("DECLINE");

    document.documentElement.style.setProperty('--steps', stepIndicators.length);

    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTINXx35PLxURTZ2raLSwJQVCBh5pzE4kAqjl8RGQey0slb9D1ck7TFrT7qJn0uuTgRN3ajjdl6oxh3/pub?output=csv";
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxab20ao2VGUxjQHiZLBoN6M4aNvfC9HaP5wgsQG_oHQOjd3yWPXgPV9ibzo7kDuwLjpg/exec";

    let currentStep = 0;
    let responseSelected = false;
    let currentGuest = null;
    let allGuests = [];

    async function fetchGuests() {
        const response = await fetch(APPS_SCRIPT_URL + `?t=${Date.now()}`);
        const rows = await response.json();

        return rows.map(row => ({
            first: row["first"]?.toString().trim().toLowerCase(),       // header must be "first"
            middle: row["middle"]?.toString().trim().toLowerCase(),     // header must be "middle"
            last: row["last"]?.toString().trim().toLowerCase(),         // header must be "last"
            familyGroup: row["family-group"]?.toString().trim().toLowerCase(), // header must be "family-group"
            plusOne: row["plus 1"]?.toString().trim(),                  // header must be "plus 1"
            response: row["response"]?.toString().trim().toLowerCase(), // header must be "response"
            email: row["email"]?.toString().trim()                      // header must be "email"
        }));
    }

    async function updateGuestResponse(first, last, response) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ first, last, response })
            });
        } catch (err) {
            console.error("Could not update response:", err);
        }
    }

    async function updatePlusOne(first, last, plusOne) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ first, last, plusOne })
            });
        } catch (err) {
            console.error("Could not update plus one:", err);
        }
    }

    async function updateFamilyResponse(first, last, response) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ first, last, response })
            });
        } catch (err) {
            console.error("Could not update family response:", err);
        }
    }

    function renderFamilyList(currentGuest, allGuests) {
        // Remove existing family list if any
        const existing = document.querySelector(".family-list");
        if (existing) existing.remove();

        // Skip if no family group assigned 👈 handles blank family group
        if (!currentGuest.familyGroup) return;

        // Find family members with same group, excluding current guest
        const familyMembers = allGuests.filter(g =>
            g.familyGroup &&
            g.familyGroup === currentGuest.familyGroup &&
            !(g.first === currentGuest.first && g.last === currentGuest.last)
        );

        // Skip if no other family members found
        if (familyMembers.length === 0) return;

        // Create family list container
        const familyList = document.createElement("div");
        familyList.classList.add("family-list");

        const heading = document.createElement("p");
        heading.classList.add("family-heading");
        heading.textContent = "RSVP for your family";
        familyList.appendChild(heading);

        familyMembers.forEach(member => {
            const hasResponded = member.response === "yes" || member.response === "no";
            const isChecked = member.response === "yes";
            const fullName = `${member.first} ${member.middle || ""} ${member.last}`.trim();

            const wrapper = document.createElement("p");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("family-checkbox");
            checkbox.id = `family-${member.first}-${member.last}`;
            checkbox.checked = isChecked;
            checkbox.disabled = hasResponded;
            checkbox.dataset.first = member.first;
            checkbox.dataset.last = member.last;

            const label = document.createElement("label");
            label.htmlFor = `family-${member.first}-${member.last}`;
            label.textContent = fullName;

            if (hasResponded) {
                label.style.opacity = "0.5";
                label.style.cursor = "not-allowed";
            }

            if (!hasResponded) {
                checkbox.addEventListener("change", () => {
                    updateFamilyResponse(
                        member.first,
                        member.last,
                        checkbox.checked ? "yes" : ""
                    );
                });
            }

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            familyList.appendChild(wrapper);
        });

        // Insert after plus one container
        const checkContainer = document.querySelector(".check-container");
        checkContainer.insertAdjacentElement("afterend", familyList);
    }

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

    function updateButtons() {
        findButton.style.display = currentStep === 0 ? "block" : "none";
        findButton.tabIndex = currentStep === 0 ? 0 : -1;

        continueButton.style.display = currentStep === 1 ? "block" : "none";
        continueButton.tabIndex = currentStep === 1 ? 0 : -1;

        submitButton.style.display = currentStep === 2 ? "block" : "none";
        submitButton.tabIndex = currentStep === 2 ? 0 : -1;
    }

    function addRemoveActive(remove, add) {
        remove.classList.remove("active");
        add.classList.add("active");
    }

    function showError(message) {
        let errorEl = document.querySelector(".validation-error");
        if (!errorEl) {
            errorEl = document.createElement("p");
            errorEl.classList.add("validation-error");
            document.querySelector(".controls").insertAdjacentElement("beforebegin", errorEl);
        }
        errorEl.textContent = message;

        // Auto-clear after 3 seconds
        clearTimeout(errorEl._timer);
        errorEl._timer = setTimeout(() => {
            errorEl.remove();
        }, 5000);
    }

    function clearError() {
        const errorEl = document.querySelector(".validation-error");
        if (errorEl) errorEl.remove();
    }

    document.querySelector(".form-wizard").addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault(); // 👈 prevent all default tab behavior

            const currentStepEl = steps[currentStep];
            const stepFocusable = Array.from(currentStepEl.querySelectorAll(
                'input, select, textarea'
            )).filter(el => !el.disabled);

            // Get the visible control button
            const visibleButton = [findButton, continueButton, submitButton]
                .find(btn => btn.style.display === "block");

            // Combine step inputs + visible button
            const focusable = visibleButton 
                ? [...stepFocusable, visibleButton] 
                : stepFocusable;

            if (focusable.length === 0) return;

            const currentIndex = focusable.indexOf(document.activeElement);

            if (e.shiftKey) {
                // Tab backwards
                const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
                focusable[prevIndex].focus();
            } else {
                // Tab forwards
                const nextIndex = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
                focusable[nextIndex].focus();
            }
        }
    });


    //*event listeners

    findButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const first = document.getElementById("first").value.trim().toLowerCase();
        const last = document.getElementById("last").value.trim().toLowerCase();

        if (!first || !last) {
            showError("Please enter your first/middle and last name.");
            return;
        }

        findButton.textContent = "Searching...";
        findButton.disabled = true;

        try {
            const guests = await fetchGuests();

            // Find all matches
            const allMatches = guests.filter(g => {
                const fullFirst = `${g.first} ${g.middle}`.trim();
                return (
                    g.first === first ||
                    g.middle === first ||
                    fullFirst === first
                ) && g.last === last;
            });

            let found;

            if (allMatches.length > 1) {
                // Try to narrow down by matching first AND middle
                const narrowed = allMatches.find(g =>
                    g.first === first && g.middle === first
                ) || allMatches.find(g =>
                    g.middle === first
                ) || allMatches.find(g =>
                    g.first === first && !g.middle
                );

                if (!narrowed || allMatches.filter(g => g.first === first).length > 1) {
                    // Still ambiguous — prompt for middle name
                    showError("Multiple guests found with this name. Please include your middle name in the first field.");
                    findButton.textContent = "FIND YOUR INVITATION";
                    findButton.disabled = false;
                    return;
                }

                found = narrowed;

            } else {
                found = allMatches[0];
            }

            if (!found) {
                showError("Oops! We are having trouble finding your invite. Please try another spelling of your name or contact the couple.");
                findButton.textContent = "FIND YOUR INVITATION";
                findButton.disabled = false;
                return;
            }

            currentGuest = found;
            allGuests = guests;
            renderFamilyList(found, allGuests);

            // Update guest name in step 2
            const guestNameEl = document.querySelector(".guest-name");
            guestNameEl.textContent = `${found.first} ${found.middle || ""} ${found.last}`.trim();

            // Plus one visibility
            const plusOneCheckbox = document.getElementById("plus-one");
            const plusOneContainer = document.querySelector(".check-container");

            if (found.plusOne === "0") {
                plusOneContainer.style.display = "none";
            } else {
                plusOneContainer.style.display = "block";
                plusOneCheckbox.checked = found.response === "yes" && found.plusOne === "1";
            }

            // Pre-select accept/decline based on existing response
            if (found.response === "yes") {
                addRemoveActive(declineBtn, acceptBtn);
                responseSelected = true;
                plusOneCheckbox.disabled = false;
            } else if (found.response === "no") {
                addRemoveActive(acceptBtn, declineBtn);
                responseSelected = true;
                plusOneCheckbox.disabled = true;
                plusOneCheckbox.checked = false;
            } else {
                acceptBtn.classList.remove("active");
                declineBtn.classList.remove("active");
                plusOneCheckbox.disabled = true;
                plusOneCheckbox.checked = false;
                responseSelected = false;
            }

            clearError();
            findButton.textContent = "FIND YOUR INVITATION";
            findButton.disabled = false;
            currentStep++;
            updateProgress();

        } catch (err) {
            showError("Could not load guest list. Please try again.");
            findButton.textContent = "FIND YOUR INVITATION";
            findButton.disabled = false;
            console.error(err);
        }
    });

    continueButton.addEventListener("click", (e) => {
        e.preventDefault();

        if (!responseSelected) {
            showError("Please select Accept or Decline before continuing.");
            return;
        }

        const plusOne = document.getElementById("plus-one").checked;
        updatePlusOne(
            document.getElementById("first").value.trim().toLowerCase(),
            document.getElementById("last").value.trim().toLowerCase(),
            plusOne ? "1" : ""
        );

        // Pre-fill email if exists 👈
        if (currentGuest && currentGuest.email) {
            document.querySelector('input[name="email"]').value = currentGuest.email;
        }

        if (currentStep < 3) {
            currentStep++;
            updateProgress();

            setTimeout(() => {
                stepsContainer.style.height = steps[currentStep].offsetHeight + "px";
            }, 50);
        }
    });

    submitButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = document.querySelector('input[name="email"]').value.trim();
        const first = document.getElementById("first").value.trim().toLowerCase();
        const last = document.getElementById("last").value.trim().toLowerCase();
        const response = acceptBtn.classList.contains("active") ? "yes" : "no";
        const successMessage = document.querySelector(".success-message"); // 👈
        const successEmail = document.querySelector(".success-email");     // 👈

        console.log("Submitting:", { first, last, email, response });

        submitButton.textContent = "Submitting";
        submitButton.classList.add("loading-btn");
        submitButton.disabled = true;

        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ first, last, email, response, sendConfirmation: true })
            });

            if (email) {
                successMessage.textContent = "Your RSVP has been confirmed. A confirmation has been sent to:";
                successEmail.textContent = email;
            } else {
                successMessage.textContent = response === "yes"
                    ? "Your RSVP has been confirmed. We look forward to celebrating with you!"
                    : "Thank you for letting us know. You will be missed!";
                if (successEmail) successEmail.textContent = "";
            }

            currentStep++;
            updateProgress();

            setTimeout(() => {
                stepsContainer.style.height = steps[currentStep].offsetHeight + "px";
            }, 50);

        } catch (err) {
            console.error("Submit error:", err);
            showError("Could not submit RSVP. Please try again.");
            submitButton.textContent = "COMPLETE";
            submitButton.classList.remove("loading-btn");
            submitButton.disabled = false;
        }
    });

    //accept & decline

    acceptBtn.onclick = () => {
        addRemoveActive(declineBtn, acceptBtn);
        responseSelected = true;

        const plusOne = document.getElementById("plus-one");
        plusOne.disabled = false; // 👈 CSS handles the visual

        updateGuestResponse(
            document.getElementById("first").value.trim().toLowerCase(),
            document.getElementById("last").value.trim().toLowerCase(),
            "yes"
        );
    };

    declineBtn.onclick = () => {
        addRemoveActive(acceptBtn, declineBtn);
        responseSelected = true;

        const plusOne = document.getElementById("plus-one");
        plusOne.disabled = true;  // 👈 CSS handles the visual
        plusOne.checked = false;

        updateGuestResponse(
            document.getElementById("first").value.trim().toLowerCase(),
            document.getElementById("last").value.trim().toLowerCase(),
            "no"
        );
    };

    updateProgress();
});