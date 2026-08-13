/* =====================================================
   PECAÑA DENTAL CLINIC SYSTEM
   Predictive Restock Forecasting
===================================================== */


/* =====================================================
   APPOINTMENTS
===================================================== */

let appts = [];


/* =====================================================
   INVENTORY ADJUSTMENT
===================================================== */

let adjustIndex = null;


/* =====================================================
   REORDER SUGGESTIONS
===================================================== */

let reorderSuggestions = [];


/* =====================================================
   BILL OF MATERIALS
=====================================================

   Each procedure consumes a predefined amount
   of each material.

===================================================== */

const bom = {

    "Cleaning": {

        "Dental floss": 1,

        "Prophy paste": 1

    },


    "Extraction": {

        "Local anesthetic": 2,

        "Dental floss": 1,

        "Suture": 2

    },


    "Filling": {

        "Composite resin": 1,

        "Bonding agent": 1,

        "Local anesthetic": 1

    },


    "Root Canal": {

        "Composite resin": 1,

        "Bonding agent": 1,

        "Local anesthetic": 2,

        "Dental floss": 1

    },


    "Full-mouth Restoration": {

        "Composite resin": 8,

        "Bonding agent": 4,

        "Local anesthetic": 6,

        "Dental floss": 4

    }

};


/* =====================================================
   INVENTORY
=====================================================

   onHand       = current inventory

   reorderPoint = minimum safe stock

   leadTime     = supplier delivery time in days

===================================================== */

let inventory = [

    {
        name: "Composite resin",
        onHand: 18,
        reorderPoint: 10,
        leadTime: 5,
        unit: "units"
    },


    {
        name: "Bonding agent",
        onHand: 14,
        reorderPoint: 8,
        leadTime: 5,
        unit: "units"
    },


    {
        name: "Local anesthetic",
        onHand: 24,
        reorderPoint: 12,
        leadTime: 3,
        unit: "cartridges"
    },


    {
        name: "Dental floss",
        onHand: 10,
        reorderPoint: 6,
        leadTime: 4,
        unit: "units"
    },


    {
        name: "Suture",
        onHand: 16,
        reorderPoint: 8,
        leadTime: 5,
        unit: "units"
    },


    {
        name: "Prophy paste",
        onHand: 12,
        reorderPoint: 5,
        leadTime: 4,
        unit: "units"
    }

];


/* =====================================================
   LOGIN MODAL
===================================================== */

function toggleModal(show) {

    document.getElementById(
        "login-modal"
    ).style.display = show
        ? "flex"
        : "none";

}


/* =====================================================
   ADMIN LOGIN
===================================================== */

function adminLogin(event) {

    event.preventDefault();


    const username =
        document.getElementById(
            "adm-user"
        ).value;


    const password =
        document.getElementById(
            "adm-pass"
        ).value;


    const error =
        document.getElementById(
            "auth-error"
        );


    if (
        username === "admin" &&
        password === "1234"
    ) {

        document
            .getElementById("patient-portal")
            .classList
            .add("hidden");


        document
            .getElementById("admin-dashboard")
            .classList
            .remove("hidden");


        toggleModal(false);

        error.style.display = "none";

        updateAll();

    } else {

        error.style.display = "block";

    }

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    location.reload();

}


/* =====================================================
   ADMIN TAB SWITCHER
===================================================== */

function switchAdminTab(
    tabId,
    element
) {

    document
        .querySelectorAll(".admin-tab")
        .forEach(
            tab =>
                tab.classList.remove("active")
        );


    document
        .querySelectorAll(".side-nav li")
        .forEach(
            item =>
                item.classList.remove("active")
        );


    document
        .getElementById(
            tabId + "-tab"
        )
        .classList
        .add("active");


    element.classList.add("active");


    document
        .getElementById("tab-title")
        .innerText =
            element.innerText.trim();


    if (tabId === "inventory") {

        renderInventory();

    }

}


/* =====================================================
   PATIENT BOOKING
===================================================== */

document
    .getElementById("p-booking-form")
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const entry = {

                name:
                    document
                        .getElementById("p-name")
                        .value,

                phone:
                    document
                        .getElementById("p-phone")
                        .value,

                service:
                    document
                        .getElementById("p-service")
                        .value,

                date:
                    document
                        .getElementById("p-date")
                        .value,

                status: "Pending",

                completed: false

            };


            appts.push(entry);


            updateAll();


            alert(
                "Appointment Request Sent Successfully!"
            );


            this.reset();

        }
    );


/* =====================================================
   FORECAST CALCULATION
=====================================================

   Looks at appointments within the selected
   forecast period.

===================================================== */

function getForecast(days) {

    const now = new Date();


    const cutoff = new Date();


    cutoff.setHours(
        23,
        59,
        59,
        999
    );


    cutoff.setDate(
        cutoff.getDate() + days
    );


    const usage = {};


    inventory.forEach(
        item => {
            usage[item.name] = 0;
        }
    );


    appts.forEach(
        appointment => {

            if (
                !appointment.date ||
                appointment.completed
            ) {
                return;
            }


            const appointmentDate =
                new Date(
                    appointment.date +
                    "T00:00:00"
                );


            if (
                appointmentDate >= now &&
                appointmentDate <= cutoff
            ) {

                const procedureMaterials =
                    bom[
                        appointment.service
                    ] || {};


                Object.entries(
                    procedureMaterials
                ).forEach(
                    ([material, quantity]) => {

                        if (
                            usage[material] !==
                            undefined
                        ) {

                            usage[material] +=
                                quantity;

                        }

                    }
                );

            }

        }
    );


    return usage;

}


/* =====================================================
   INVENTORY FORECAST
===================================================== */

function getInventoryForecast(days) {

    const usage =
        getForecast(days);


    return inventory.map(
        (item, index) => {

            const forecastUse =
                usage[item.name] || 0;


            const projectedStock =
                item.onHand -
                forecastUse;


            const reorderNeeded =
                projectedStock <
                item.reorderPoint;


            return {

                ...item,

                index,

                forecastUse,

                projected:
                    projectedStock,

                reorderNeeded

            };

        }
    );

}


/* =====================================================
   RENDER INVENTORY
===================================================== */

function renderInventory() {

    const days =
        Number(
            document
                .getElementById(
                    "forecast-days"
                )
                .value
        );


    const rows =
        getInventoryForecast(days);


    const tbody =
        document.getElementById(
            "inventory-tbody"
        );


    tbody.innerHTML = "";


    rows.forEach(
        row => {

            let status;


            if (
                row.projected < 0
            ) {

                status =
                    `<span class="badge badge-red">
                        Insufficient
                    </span>`;

            } else if (
                row.reorderNeeded
            ) {

                status =
                    `<span class="badge badge-orange">
                        Reorder
                    </span>`;

            } else {

                status =
                    `<span class="badge badge-green">
                        OK
                    </span>`;

            }


            tbody.innerHTML += `

                <tr>

                    <td>

                        <strong>
                            ${row.name}
                        </strong>

                        <br>

                        <span class="small">
                            ${row.unit}
                        </span>

                    </td>


                    <td>
                        ${row.onHand}
                    </td>


                    <td>
                        ${row.forecastUse}
                    </td>


                    <td>

                        <strong>
                            ${row.projected}
                        </strong>

                    </td>


                    <td>
                        ${row.leadTime} days
                    </td>


                    <td>
                        ${row.reorderPoint}
                    </td>


                    <td>
                        ${status}
                    </td>


                    <td>

                        <button
                            class="btn btn-light"
                            onclick="openAdjust(${row.index})"
                        >
                            Quick Adjust
                        </button>

                    </td>

                </tr>

            `;

        }
    );


    const urgent =
        rows.filter(
            row =>
                row.projected < 0
        );


    const notice =
        document.getElementById(
            "inventory-notice"
        );


    if (urgent.length) {

        notice.innerHTML = `

            <div class="notice">

                <strong>
                    Warning:
                </strong>

                ${urgent.length}
                material(s) will be
                exhausted within the
                selected ${days}-day
                forecast window.

                Review reorder
                suggestions before
                accepting additional
                demand.

            </div>

        `;

    } else {

        notice.innerHTML = "";

    }


    updateStats(rows);

}


/* =====================================================
   GENERATE REORDER SUGGESTIONS
===================================================== */

function generateReorders() {

    const days =
        Number(
            document
                .getElementById(
                    "forecast-days"
                )
                .value
        );


    const rows =
        getInventoryForecast(days)
            .filter(
                row =>
                    row.reorderNeeded
            );


    reorderSuggestions =
        rows.map(
            row => ({

                material:
                    row.name,

                quantity:
                    Math.max(
                        0,

                        row.forecastUse +
                        row.reorderPoint -
                        row.onHand
                    ),

                leadTime:
                    row.leadTime,

                arriveBy:
                    `${row.leadTime} day(s) after order`

            })
        );


    const list =
        document.getElementById(
            "reorder-list"
        );


    if (
        reorderSuggestions.length
    ) {

        list.innerHTML =
            reorderSuggestions
                .map(
                    suggestion => `

                        <div
                            style="
                                padding:10px 0;
                                border-bottom:1px solid #eee;
                            "
                        >

                            <strong>
                                ${suggestion.material}
                            </strong>

                            —

                            Order

                            <strong>
                                ${suggestion.quantity}
                            </strong>

                            unit(s);

                            supplier lead time:

                            ${suggestion.leadTime}
                            days;

                            target arrival:

                            ${suggestion.arriveBy}.

                        </div>

                    `
                )
                .join("");

    } else {

        list.innerHTML =
            "No reorder is required for the selected forecast window.";

    }


    updateStats(
        getInventoryForecast(days)
    );


    alert(
        reorderSuggestions.length

            ? `${reorderSuggestions.length} reorder suggestion(s) generated.`

            : "No reorder is required."
    );

}


/* =====================================================
   QUICK INVENTORY ADJUSTMENT
===================================================== */

function openAdjust(index) {

    adjustIndex = index;


    document.getElementById(
        "adjust-material-name"
    ).innerText =
        `Updating: ${inventory[index].name}`;


    document.getElementById(
        "adjust-qty"
    ).value =
        inventory[index].onHand;


    document.getElementById(
        "adjust-reason"
    ).value = "";


    document.getElementById(
        "adjust-modal"
    ).style.display = "flex";

}


/* =====================================================
   CLOSE ADJUSTMENT MODAL
===================================================== */

function closeAdjust() {

    document.getElementById(
        "adjust-modal"
    ).style.display = "none";


    adjustIndex = null;

}


/* =====================================================
   SAVE INVENTORY ADJUSTMENT
===================================================== */

function saveAdjust() {

    if (
        adjustIndex === null
    ) {
        return;
    }


    const quantity =
        Number(
            document
                .getElementById(
                    "adjust-qty"
                )
                .value
        );


    const reason =
        document
            .getElementById(
                "adjust-reason"
            )
            .value
            .trim();


    if (
        !Number.isFinite(quantity) ||
        quantity < 0
    ) {

        alert(
            "Enter a valid non-negative quantity."
        );

        return;

    }


    inventory[
        adjustIndex
    ].onHand =
        quantity;


    closeAdjust();


    updateAll();


    alert(
        reason
            ? `Inventory adjustment saved: ${reason}`
            : "Inventory adjustment saved."
    );

}


/* =====================================================
   APPROVE APPOINTMENT
===================================================== */

function approveApp(index) {

    appts[index].status =
        "Approved";


    updateAll();


    alert(
        "Appointment Approved!"
    );

}


/* =====================================================
   COMPLETE PROCEDURE
=====================================================

   This is the Integrity Loop.

   Completing a procedure automatically
   deducts its BOM materials from inventory.

===================================================== */

function completeApp(index) {

    if (
        appts[index].completed
    ) {
        return;
    }


    const procedure =
        bom[
            appts[index].service
        ] || {};


    Object.entries(
        procedure
    ).forEach(
        ([material, quantity]) => {

            const item =
                inventory.find(
                    inventoryItem =>
                        inventoryItem.name ===
                        material
                );


            if (item) {

                item.onHand =
                    Math.max(
                        0,

                        item.onHand -
                        quantity
                    );

            }

        }
    );


    appts[index].completed =
        true;


    appts[index].status =
        "Completed";


    updateAll();


    alert(
        "Procedure completed and BOM consumption deducted from inventory."
    );

}


/* =====================================================
   UPDATE APPOINTMENTS TABLE
===================================================== */

function updateAppointments() {

    const tbody =
        document.getElementById(
            "app-tbody"
        );


    if (!appts.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="small"
                >
                    No appointment requests yet.
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        appts
            .map(
                (appointment, index) => {

                    let badgeClass =
                        "badge-orange";


                    if (
                        appointment.status ===
                        "Approved"
                    ) {

                        badgeClass =
                            "badge-green";

                    }


                    if (
                        appointment.status ===
                        "Completed"
                    ) {

                        badgeClass =
                            "badge-green";

                    }


                    let action = "";


                    if (
                        appointment.status ===
                        "Pending"
                    ) {

                        action = `

                            <button
                                class="btn btn-purple"
                                onclick="approveApp(${index})"
                            >
                                Approve
                            </button>

                        `;

                    }


                    if (
                        appointment.status ===
                        "Approved"
                    ) {

                        action = `

                            <button
                                class="btn btn-purple"
                                onclick="completeApp(${index})"
                            >
                                Complete
                            </button>

                        `;

                    }


                    return `

                        <tr>

                            <td>
                                <strong>
                                    ${appointment.name}
                                </strong>
                            </td>

                            <td>
                                ${appointment.service}
                            </td>

                            <td>
                                ${appointment.date}
                            </td>

                            <td>

                                <span
                                    class="
                                        badge
                                        ${badgeClass}
                                    "
                                >
                                    ${appointment.status}
                                </span>

                            </td>

                            <td>
                                ${action}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =====================================================
   UPDATE DASHBOARD STATISTICS
===================================================== */

function updateStats(
    rows =
        getInventoryForecast(
            Number(
                document
                    .getElementById(
                        "forecast-days"
                    )
                    .value
            )
        )
) {

    document.getElementById(
        "stat-total"
    ).innerText =
        appts.length;


    document.getElementById(
        "stat-pending"
    ).innerText =
        appts.filter(
            appointment =>
                appointment.status ===
                "Pending"
        ).length;


    document.getElementById(
        "stat-low"
    ).innerText =
        rows.filter(
            row =>
                row.reorderNeeded
        ).length;


    document.getElementById(
        "stat-reorders"
    ).innerText =
        reorderSuggestions.length;


    const urgent =
        rows.filter(
            row =>
                row.projected < 0
        );


    const summary =
        document.getElementById(
            "monitoring-summary"
        );


    if (urgent.length) {

        summary.innerHTML = `

            <div class="notice">

                <strong>
                    Immediate attention:
                </strong>

                ${urgent
                    .map(
                        row =>
                            `${row.name}
                            (${row.projected}
                            projected)`
                    )
                    .join(", ")}.

            </div>

        `;

    } else {

        summary.innerHTML = `

            <div
                class="
                    badge
                    badge-green
                "
            >

                Forecast currently shows
                sufficient stock for
                scheduled demand.

            </div>

        `;

    }

}


/* =====================================================
   RENDER BOM TABLE
===================================================== */

function renderBom() {

    const tbody =
        document.getElementById(
            "bom-tbody"
        );


    const rows = [];


    Object.entries(
        bom
    ).forEach(
        ([procedure, materials]) => {

            Object.entries(
                materials
            ).forEach(
                ([material, quantity]) => {

                    rows.push(`

                        <tr>

                            <td>
                                ${procedure}
                            </td>

                            <td>
                                ${material}
                            </td>

                            <td>
                                ${quantity}
                            </td>

                        </tr>

                    `);

                }
            );

        }
    );


    tbody.innerHTML =
        rows.join("");

}


/* =====================================================
   UPDATE EVERYTHING
===================================================== */

function updateAll() {

    updateAppointments();

    renderInventory();

    renderBom();

    updateStats();

}


/* =====================================================
   INITIALIZE SYSTEM
===================================================== */

updateAll();