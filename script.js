        const STORAGE={
            patients:"pecana_patients",
            appointments:"pecana_appointments",
            appointmentQueue:"pecana_appointment_queue",
            walkins:"pecana_walkin_queue",
            inventory:"pecana_inventory"
        };

        // --- GLOBALS (Graphics & Interactive Prediction) ---
        let genderChartInstance = null;
        let serviceChartInstance = null;
        let inventoryChartInstance = null;
        let temporaryMaterialAdjustments = {}; // Holds +/- changes before saving
        let temporaryWalkinAdjustments = {}; // Tracking +/- for current walk-in modal

        const load=(key,fallback=[])=>{
            try{
                const data=JSON.parse(localStorage.getItem(key));
                return Array.isArray(data)?data:fallback;
            }catch{return fallback}
        };

        const save=(key,data)=>localStorage.setItem(key,JSON.stringify(data));

        const today=()=>new Date().toISOString().slice(0,10);

        const formatDate=d=>d?new Date(d+"T00:00:00").toLocaleDateString("en-US",
            {month:"short",day:"numeric",year:"numeric"}):"-";

        const formatTime=t=>{
            if(!t)return"-";
            const [h,m]=t.split(":");
            const d=new Date();
            d.setHours(+h,+m);
            return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
        };

        const esc=v=>String(v??"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

        const statusClass=s=>(s||"Waiting").toLowerCase().replaceAll(" ","-");

        const nextId=(prefix,arr)=>{
            const nums=arr.map(x=>{
                const n=parseInt(String(x.id||"").replace(/\D/g,""));
                return isNaN(n)?0:n;
            });
            return prefix+String(Math.max(0,...nums)+1).padStart(3,"0");
        };

        const nextQueue=(prefix,arr)=>{
            const nums=arr.map(x=>parseInt(String(x.number||"").replace(/\D/g,"")))
                .filter(n=>!isNaN(n));
            return prefix+String(Math.max(0,...nums)+1).padStart(3,"0");
        };

    /* ================= DATA ================= */

    let patients = load(STORAGE.patients, [
        { id: "P001", name: "Juan Dela Cruz", contact: "09171234567", dob: "1985-05-15", address: "Polangui, Albay", gender: "Male", emergency: "Maria Dela Cruz", concern: "Regular dental check-up", status: "Active" },
        { id: "P002", name: "Maria Santos", contact: "09181234567", dob: "1992-08-22", address: "Oas, Albay", gender: "Female", emergency: "Pedro Santos", concern: "Tooth cleaning", status: "Active" },
        { id: "P003", name: "Carlos Reyes", contact: "09191234567", dob: "1980-02-10", address: "Ligao City, Albay", gender: "Male", emergency: "Ana Reyes", concern: "Tooth pain", status: "Active" },
        { id: "P004", name: "Antonio Rivera", contact: "09201112233", dob: "1995-04-12", address: "Guinobatan, Albay", gender: "Male", emergency: "Liza Rivera", concern: "Braces adjustment", status: "Active" },
        { id: "P005", name: "Elena Garcia", contact: "09212223344", dob: "1988-11-30", address: "Polangui, Albay", gender: "Female", emergency: "Jose Garcia", concern: "Wisdom tooth consultation", status: "Active" },
        { id: "P006", name: "Ricardo Ramos", contact: "09223334455", dob: "1975-07-08", address: "Camalig, Albay", gender: "Male", emergency: "Celia Ramos", concern: "Gum bleeding", status: "Active" },
        { id: "P007", name: "Josefina Mendoza", contact: "09234445566", dob: "1960-01-25", address: "Oas, Albay", gender: "Female", emergency: "Mario Mendoza", concern: "Dentures fitting", status: "Active" },
        { id: "P008", name: "Manuel Castro", contact: "09245556677", dob: "1998-12-05", address: "Ligao City, Albay", gender: "Male", emergency: "Sara Castro", concern: "Teeth whitening", status: "Active" },
        { id: "P009", name: "Remedios Lopez", contact: "09256667788", dob: "1972-03-18", address: "Polangui, Albay", gender: "Female", emergency: "Danilo Lopez", concern: "Root canal therapy", status: "Active" },
        { id: "P010", name: "Francisco Tan", contact: "09267778899", dob: "1983-06-21", address: "Guinobatan, Albay", gender: "Male", emergency: "Aimee Tan", concern: "Dental implants", status: "Active" },
        { id: "P011", name: "Pacita Aquino", contact: "09278889900", dob: "1990-10-10", address: "Oas, Albay", gender: "Female", emergency: "Ben Aquino", concern: "Scaling and polishing", status: "Active" },
        { id: "P012", name: "Ramon Bautista", contact: "09289990011", dob: "1965-08-05", address: "Camalig, Albay", gender: "Male", emergency: "Vilma Bautista", concern: "Crown replacement", status: "Active" },
        { id: "P013", name: "Luzviminda Villamor", contact: "09290001122", dob: "1978-02-28", address: "Ligao City, Albay", gender: "Female", emergency: "Oscar Villamor", concern: "Bad breath consultation", status: "Active" },
        { id: "P014", name: "Angelito Gonzales", contact: "09301112233", dob: "2000-07-22", address: "Polangui, Albay", gender: "Male", emergency: "Grace Gonzales", concern: "Mouth guard fitting", status: "Active" },
        { id: "P015", name: "Corazon Salvador", contact: "09312223344", dob: "1996-04-09", address: "Oas, Albay", gender: "Female", emergency: "Luis Salvador", concern: "Tooth extraction", status: "Active" },
        { id: "P016", name: "Benigno Dizon", contact: "09323334455", dob: "1982-01-01", address: "Guinobatan, Albay", gender: "Male", emergency: "Cory Dizon", concern: "Bridge adjustment", status: "Active" },
        { id: "P017", name: "Teresita Roxas", contact: "09334445566", dob: "2005-09-14", address: "Polangui, Albay", gender: "Female", emergency: "Felipe Roxas", concern: "Cavity filling", status: "Active" },
        { id: "P018", name: "Fidel Pineda", contact: "09345556677", dob: "1987-12-30", address: "Camalig, Albay", gender: "Male", emergency: "Eva Pineda", concern: "Sensitivity issues", status: "Active" },
        { id: "P019", name: "Gloria de Leon", contact: "09356667788", dob: "1993-05-04", address: "Ligao City, Albay", gender: "Female", emergency: "Mar de Leon", concern: "Impacted tooth", status: "Active" },
        { id: "P020", name: "Oscar Macapagal", contact: "09367778899", dob: "1955-11-11", address: "Oas, Albay", gender: "Male", emergency: "Nestor Macapagal", concern: "Jaw pain", status: "Active" }
    ]);

    let appointments = load(STORAGE.appointments, [
        { id: "APT001", patientId: "P001", patientName: "Juan Dela Cruz", date: today(), time: "09:00", service: "Dental Check-up", status: "Approved", queueStatus: "Waiting", customMaterials: { "Dental Floss": 1 } }
    ]);

    let appointmentQueue = load(STORAGE.appointmentQueue, [
        { number: "A001", appointmentId: "APT001", patientId: "P001", patientName: "Juan Dela Cruz", service: "Dental Check-up", time: "09:00", date: today(), status: "Waiting" }
    ]);

    let walkins=load(STORAGE.walkins,[]);

    let inventory=load(STORAGE.inventory,[
        {id:"I001",name:"Composite Resin",stock:12,minimum:5,leadTime:5},
        {id:"I002",name:"Dental Floss",stock:10,minimum:5,leadTime:3},
        {id:"I003",name:"Bonding Agent",stock:8,minimum:5,leadTime:5},
        {id:"I004",name:"Suture Material",stock:15,minimum:5,leadTime:4}
    ]);
        /* ================= INVENTORY BOM & DEDUCTION ================= */

        const BOM = {
            "Dental Check-up": { "Dental Floss": 1 },
            "Dental Cleaning": { "Dental Floss": 2 },
            "Tooth Restoration": { "Composite Resin": 1, "Bonding Agent": 1 },
            "Tooth Extraction": { "Suture Material": 2 }
        };

        function consumeInventory(service, appointmentId = null) {
            let materials = BOM[service] || {};

            // Use custom materials saved with the appointment if they exist
            if (appointmentId) {
                const appt = appointments.find(a => a.id === appointmentId);
                if (appt && appt.customMaterials) {
                    materials = appt.customMaterials;
                }
            }

            Object.entries(materials).forEach(([name, qty]) => {
                const item = inventory.find(x => x.name === name);
                if (item) {
                    item.stock = Math.max(0, item.stock - qty);
                }
            });
            save(STORAGE.inventory, inventory);
        }

        /* ================= PUBLIC NAVIGATION ================= */

        function showPublicPage(page){
            document.getElementById("publicApp").classList.remove("hidden");
            document.getElementById("loginPage").classList.add("hidden");
            document.getElementById("adminApp").classList.add("hidden");
            document.querySelectorAll(".public-page").forEach(x=>x.classList.remove("active"));
            const target=document.getElementById("public-"+page);
            if(target)target.classList.add("active");
            if(page==="queue-status")renderPublicQueues();
            updatePublicStats();
        }

        function showPublicSite(){
            document.getElementById("publicApp").classList.remove("hidden");
            document.getElementById("loginPage").classList.add("hidden");
            document.getElementById("adminApp").classList.add("hidden");
            showPublicPage("home");
        }

        function showLogin(){
            document.getElementById("publicApp").classList.add("hidden");
            document.getElementById("adminApp").classList.add("hidden");
            document.getElementById("loginPage").classList.remove("hidden");
        }

        function logout(){ showPublicSite(); }

    /* ================= LOGIN ================= */

    document.getElementById("loginForm").addEventListener("submit", e => {
        e.preventDefault();
        const user = document.getElementById("loginUsername").value.trim();
        const pass = document.getElementById("loginPassword").value.trim();
        
        // Check credentials
        if ((user === "admin" && pass === "admin123") || (user === "administrator" && pass === "admin123")) {
            document.getElementById("loginPage").classList.add("hidden");
            document.getElementById("publicApp").classList.add("hidden");
            document.getElementById("adminApp").classList.remove("hidden");
            openAdminPage("dashboard"); // This opens the admin area
        } else {
            alert("Invalid login.");
        }
    });
        /* ================= ADMIN NAVIGATION ================= */

        const pageNames={
            dashboard:"Dashboard",
            appointments:"Appointment Management",
            addAppointment:"Create Appointment",
            appointmentQueue:"Appointment Queue",
            walkinQueue:"Walk-In Queue",
            patients:"Patient Records",
            addPatient:"Add Patient",
            schedule:"Daily Schedule",
            inventory:"Inventory",
            forecast:"Restock Forecast",
            reports:"Reports"
        };

    function openAdminPage(page){
        document.querySelectorAll(".admin-page").forEach(x=>x.classList.remove("active"));
        const target=document.getElementById("page-"+page);
        if(!target)return;
        target.classList.add("active");
        document.querySelectorAll(".side-link").forEach(x=>x.classList.remove("active"));
        const nav=document.querySelector(`.side-link[data-page="${page}"]`);
        if(nav)nav.classList.add("active");
        document.getElementById("pageTitle").textContent=pageNames[page]||"Dashboard";
        function openAdminPage(page) {
        // Prevent the system from trying to load the old 'addAppointment' section
        if (page === 'addAppointment') {
            openAppointmentModal();
            return; // Stop here so it doesn't switch pages
        }

        document.querySelectorAll(".admin-page").forEach(x => x.classList.remove("active"));
        const target = document.getElementById("page-" + page);
        if (!target) return;
        
        target.classList.add("active");
    }

        // Reset Material Insight Card when entering Appointment screen
        if (page === 'addAppointment') {
            const card = document.getElementById("materialInsightCard");
            if(card) card.classList.add("hidden");
            temporaryMaterialAdjustments = {};
        }

        // ADD THIS BLOCK HERE:
        // This triggers the popup automatically when clicking "Appointment Management"
        if (page === 'appointments') {
            openAppointmentModal();
        }

        const calBtn = document.getElementById('advanceScheduleBtn');
        if (calBtn) {
            if (page === 'schedule') calBtn.classList.remove('hidden');
            else calBtn.classList.add('hidden');
        }
        renderAll();
    }
        document.querySelectorAll(".side-link[data-page]").forEach(btn=>{
            btn.addEventListener("click",()=>{ openAdminPage(btn.dataset.page); });
        });

        /* ================= PROFESSIONAL INTERACTIVE PREDICTION (APPOINTMENT) ================= */

        function updateMaterialPrediction() {
            const service = document.getElementById("adminAppointmentService").value;
            const card = document.getElementById("materialInsightCard");
            
            if(!card) return;

            const materials = BOM[service];

            if (materials && Object.keys(materials).length > 0) {
                card.classList.remove("hidden");
                // Clone BOM values into temporary storage
                temporaryMaterialAdjustments = { ...materials };
                renderAdjustmentList();
            } else {
                card.classList.add("hidden");
                temporaryMaterialAdjustments = {};
            }
        }

        function renderAdjustmentList() {
            const list = document.getElementById("predictionList");
            const badge = document.getElementById("stockStatusBadge");
            if (!list) return;

            let allStockOk = true;

            list.innerHTML = Object.entries(temporaryMaterialAdjustments).map(([name, qty]) => {
                const invItem = inventory.find(i => i.name === name);
                const currentStock = invItem ? invItem.stock : 0;
                const isLow = currentStock < qty;
                if (isLow) allStockOk = false;

                return `
                    <div class="prediction-item-pro">
                        <div>
                            <span class="item-name">${name}</span>
                            ${isLow ? `<span class="stock-warning"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock: ${currentStock}</span>` : ''}
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; background:white; padding:4px; border-radius:6px; border:1px solid #e2e8f0;">
                            <button type="button" class="action-btn danger" style="padding:2px 8px; margin:0;" onclick="changePredictionQty('${name}', -1)">-</button>
                            <span class="item-qty">x${qty}</span>
                            <button type="button" class="action-btn success" style="padding:2px 8px; margin:0;" onclick="changePredictionQty('${name}', 1)">+</button>
                        </div>
                    </div>
                `;
            }).join("");

            if(badge) {
                badge.textContent = allStockOk ? "Stock Verified" : "Shortage Detected";
                badge.style.background = allStockOk ? "#dcfce7" : "#fee2e2";
                badge.style.color = allStockOk ? "#166534" : "#991b1b";
            }
        }

        function changePredictionQty(name, delta) {
            const current = temporaryMaterialAdjustments[name] || 0;
            const newVal = Math.max(0, current + delta);
            temporaryMaterialAdjustments[name] = newVal;
            renderAdjustmentList();
        }

    /* ================= PROFESSIONAL INTERACTIVE PREDICTION (WALK-IN) ================= */

    function updateWalkinMaterialPrediction() {
        const service = document.getElementById("walkinService").value;
        const card = document.getElementById("walkinMaterialInsightCard");
        
        if(!card) return;

        const materials = BOM[service];

        if (materials && Object.keys(materials).length > 0) {
            card.classList.remove("hidden");
            // CLONE the BOM materials into our temporary variable
            temporaryWalkinAdjustments = JSON.parse(JSON.stringify(materials));
            renderWalkinAdjustmentList();
        } else {
            card.classList.add("hidden");
            temporaryWalkinAdjustments = {};
        }
    }

    function renderWalkinAdjustmentList() {
        const list = document.getElementById("walkinPredictionList");
        const badge = document.getElementById("walkinStockStatusBadge");
        if (!list) return;

        let allStockOk = true;

        // Use temporaryWalkinAdjustments to draw the UI
        list.innerHTML = Object.entries(temporaryWalkinAdjustments).map(([name, qty]) => {
            const invItem = inventory.find(i => i.name === name);
            const currentStock = invItem ? invItem.stock : 0;
            const isLow = currentStock < qty;
            if (isLow) allStockOk = false;

            return `
                <div class="prediction-item" style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 15px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
                    <div class="item-info">
                        <span class="item-name" style="font-weight: 600; color: #334155;">${name}</span>
                        ${isLow ? `<br><small style="color:var(--red); font-weight:700;">Shortage: Only ${currentStock} in stock</small>` : ''}
                    </div>
                    <div class="item-controls" style="display: flex; align-items: center; gap: 8px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <!-- MINUS BUTTON -->
                        <button type="button" class="qty-btn minus" onclick="changeWalkinQty('${name}', -1)">-</button>
                        
                        <!-- QUANTITY DISPLAY -->
                        <span class="qty-value" style="background-color: #f3e5f5; color: var(--purple2); padding: 2px 12px; border-radius: 4px; font-weight: 800; font-size: 0.85rem; min-width: 35px; text-align: center;">x${qty}</span>
                        
                        <!-- PLUS BUTTON -->
                        <button type="button" class="qty-btn plus" onclick="changeWalkinQty('${name}', 1)">+</button>
                    </div>
                </div>
            `;
        }).join("");

        if(badge) {
            badge.textContent = allStockOk ? "Stock Verified" : "Shortage Detected";
            badge.className = allStockOk ? "insight-badge success" : "insight-badge danger";
        }
    }


    function changeWalkinQty(name, delta) {
        // 1. Get current value from temporary storage
        const current = temporaryWalkinAdjustments[name] || 0;
        
        // 2. Calculate new value (prevent going below zero)
        const newVal = Math.max(0, current + delta);
        
        // 3. Update the temporary storage object
        temporaryWalkinAdjustments[name] = newVal;
        
        // 4. IMPORTANT: Re-run the render function to update the "x1" to "x2" etc.
        renderWalkinAdjustmentList();
    }
    //<---FIXED ADMIN APPOINTMENT SUBMIT --->
const adminForm = document.getElementById("adminAppointmentForm");
if (adminForm) {
    adminForm.addEventListener("submit", function(e) {
        e.preventDefault();

        // Get values from the Admin form IDs
        const date = document.getElementById("adminAppointmentDate").value;
        const time = document.getElementById("adminAppointmentTime").value;
        const patientId = document.getElementById("adminAppointmentPatient").value;
        const service = document.getElementById("adminAppointmentService").value;

        // 1. Validate
        if (!validateClinicSchedule(date, time)) return; 

        // 2. Find Patient
        const patient = patients.find(p => p.id === patientId);
        if (!patient) { alert("Please select a patient."); return; }

        // 3. Create Appointment Object
        const appointment = {
            id: nextId("APT", appointments),
            patientId: patient.id,
            patientName: patient.name,
            date,
            time,
            service,
            status: "Pending",
            queueStatus: null,
            customMaterials: { ...temporaryMaterialAdjustments } 
        };

        appointments.push(appointment);
        save(STORAGE.appointments, appointments);
        
        alert("Appointment created successfully for " + appointment.patientName);
        closeAppointmentModal();
        renderAll();
    });
}

    /* ================= PATIENTS ================= */
document.getElementById("patientForm").addEventListener("submit", e => {
    e.preventDefault();
    
    const name = document.getElementById("patientName").value.trim();
    if (!name) { alert("Please enter the patient's name."); return; }
    
    // 1. Exact Duplicate Check
    const duplicate = patients.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) { 
        alert("This patient is already registered."); 
        return; 
    }

    // 2. Create Patient Object
    const patient = {
        id: nextId("P", patients),
        name: name,
        contact: document.getElementById("patientContact").value.trim(),
        dob: document.getElementById("patientDOB").value,
        gender: document.getElementById("patientGender").value,
        address: document.getElementById("patientAddress").value.trim(),
        status: "Active"
    };

    // 3. Save to Data
    patients.push(patient);
    save(STORAGE.patients, patients);
    
    // 4. Close the modal FIRST
    closeAddPatientModal(); 
    
    // 5. Refresh the UI
    renderAll();
    
    alert(`${patient.name} was successfully registered.`);
});

        function viewPatient(id){
            const p=patients.find(x=>x.id===id);
            if(!p)return;
            document.getElementById("patientDetails").innerHTML=`
                <div class="patient-detail">
                    <div><strong>Patient ID</strong>${esc(p.id)}</div>
                    <div><strong>Full Name</strong>${esc(p.name)}</div>
                    <div><strong>Contact</strong>${esc(p.contact)}</div>
                    <div><strong>Date of Birth</strong>${formatDate(p.dob)}</div>
                    <div><strong>Gender</strong>${esc(p.gender||"-")}</div>
                    <div><strong>Address</strong>${esc(p.address||"-")}</div>
                    <div><strong>Emergency Contact</strong>${esc(p.emergency||"-")}</div>
                    <div><strong>Dental Concern</strong>${esc(p.concern||"-")}</div>
                </div>
            `;
            document.getElementById("patientModal").classList.remove("hidden");
        }
    function openAddPatientModal() {
        document.getElementById("addPatientModal").classList.remove("hidden");
    }

        function closeAddPatientModal() {
        document.getElementById("addPatientModal").classList.add("hidden");
        document.getElementById("patientForm").reset();
    }

        function closePatientModal(){ document.getElementById("patientModal").classList.add("hidden"); }

    function renderPatients() {
        const table = document.getElementById("patientTable");
        if (!table) return; // Prevents errors if this page isn't active

        // Safely get the search value from the new search bar
        const searchInput = document.getElementById("patientSearch");
        const filter = searchInput ? searchInput.value.toLowerCase() : "";

        if (!patients.length) { 
            table.innerHTML = `<tr><td colspan="7">No patients registered.</td></tr>`; 
            return; 
        }

        // Filter patients based on Name or ID
        const filtered = patients.filter(p => 
            p.name.toLowerCase().includes(filter) || 
            p.id.toLowerCase().includes(filter)
        );

        // If search results are empty
        if (filtered.length === 0 && filter !== "") {
            table.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#888;">No results found for "${esc(filter)}"</td></tr>`;
            return;
        }

        // Render the (filtered) rows
        table.innerHTML = filtered.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.contact)}</td>
                <td>${formatDate(p.dob)}</td>
                <td>${esc(p.concern || "-")}</td>
                <td><span class="badge approved">${p.status}</span></td>
                <td>
                    <button class="action-btn primary" onclick="viewPatient('${p.id}')">View</button>
                    <button class="action-btn success" onclick="createAppointmentFor('${p.id}')">Appt</button>
                    <button class="action-btn warning" onclick="registerPatientWalkin('${p.id}')">Walk-In</button>
                </td>
            </tr>
        `).join("");
    }

        /* ================= APPOINTMENTS ================= */

        function renderAppointmentPatients(){
            const select=document.getElementById("adminAppointmentPatient");
            if(!select)return;
            const selected=select.value;
            select.innerHTML=`<option value="">Select patient</option>`+ patients.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.id})</option>`).join("");
            if(patients.some(p=>p.id===selected)) select.value=selected;
        }

        function createAppointmentFor(id) {
        // 1. Open the modal first (this populates the dropdown list)
        openAppointmentModal();

        // 2. Automatically select the specific patient in the dropdown
        const patientDropdown = document.getElementById("adminAppointmentPatient");
        if (patientDropdown) {
            patientDropdown.value = id;
        }
    }
    // --- POPUP LOGIC ---
    function openAppointmentModal() {
        renderAppointmentPatients(); // Populates dropdown
        document.getElementById("adminAppointmentDate").value = today();
        document.getElementById("appointmentModal").classList.remove("hidden");
    }

    function closeAppointmentModal() {
        document.getElementById("appointmentModal").classList.add("hidden");
        document.getElementById("adminAppointmentForm").reset();
        document.getElementById("materialInsightCard").classList.add("hidden");
        temporaryMaterialAdjustments = {};
    }

    // --- SAFE RENDER FOR APPOINTMENTS (WITH SEARCH) ---
    function renderAppointments() {
        const table = document.getElementById("appointmentTable");
        if (!table) return; // Safety check: Prevents breaking other modules

        const searchInput = document.getElementById("appointmentSearch");
        const filter = searchInput ? searchInput.value.toLowerCase() : "";

        if (!appointments.length) { 
            table.innerHTML = `<tr><td colspan="7">No appointments found.</td></tr>`; 
            return; 
        }

        const filtered = appointments.filter(a => 
            a.patientName.toLowerCase().includes(filter) || 
            a.id.toLowerCase().includes(filter)
        );

        const sorted = [...filtered].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
        
        table.innerHTML = sorted.map(a => `
            <tr>
                <td>${a.id}</td>
                <td><strong>${esc(a.patientName)}</strong></td>
                <td>${formatDate(a.date)}</td>
                <td>${formatTime(a.time)}</td>
                <td>${esc(a.service)}</td>
                <td><span class="badge ${statusClass(a.status)}">${a.status}</span></td>
                <td>
                    ${a.status === "Pending" ? `<button class="action-btn success" onclick="approveAppointment('${a.id}')">Approve</button>` : ""}
                    ${a.status === "Approved" ? `<button class="action-btn primary" onclick="openAdminPage('appointmentQueue')">Queue</button>` : ""}
                </td>
            </tr>
        `).join("");
    }

// --- FIXED PUBLIC BOOKING LISTENER ---
const publicForm = document.getElementById("appointmentForm");
if (publicForm) {
    publicForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const date = document.getElementById("bookingDate").value;
        const time = document.getElementById("bookingTime").value;
        const name = document.getElementById("bookingName").value.trim();
        const contact = document.getElementById("bookingContact").value.trim();
        const service = document.getElementById("bookingService").value;
        const concern = document.getElementById("bookingConcern").value.trim();

        // 1. Validate
        if (!validateClinicSchedule(date, time)) return; 

        // 2. Patient Logic
        let patient = patients.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (!patient) {
            patient = { 
                id: nextId("P", patients), 
                name, contact, dob: "", address: "", gender: "", emergency: "", concern, status: "Active" 
            };
            patients.push(patient);
            save(STORAGE.patients, patients);
        }

        // 3. Create Appointment
        const appointment = { 
            id: nextId("APT", appointments), 
            patientId: patient.id, 
            patientName: patient.name, 
            date, time, service, status: "Pending", queueStatus: null 
        };

        appointments.push(appointment);
        save(STORAGE.appointments, appointments);
        
        e.target.reset();
        alert("Appointment submitted successfully!");
        showPublicPage("home");
        renderAll();
    });
}

        /* ================= APPOINTMENT QUEUE INTEGRATION ================= */

        function syncAppointmentQueue(){
            appointments.forEach(a=>{
                let q=appointmentQueue.find(x=>x.appointmentId===a.id);
                if(a.status==="Approved" && (a.queueStatus==="Waiting"||a.queueStatus==="Serving")){
                    if(!q){
                        q={ number:nextQueue("A",appointmentQueue), appointmentId:a.id, patientId:a.patientId, patientName:a.patientName, service:a.service, time:a.time, date:a.date, status:a.queueStatus };
                        appointmentQueue.push(q);
                    }else{ q.patientId=a.patientId; q.patientName=a.patientName; q.service=a.service; q.time=a.time; q.date=a.date; q.status=a.queueStatus; }
                }
                if(q){
                    if(a.status==="Completed") q.status="Completed";
                    if(a.status==="No-show") q.status="No-show";
                }
            });
            save(STORAGE.appointmentQueue,appointmentQueue);
        }

        function approveAppointment(id) {
        const a = appointments.find(x => x.id === id);
        if (!a) return;

        // 1. Ask for confirmation
        const confirmMessage = `Are you sure you want to approve the appointment for ${a.patientName} on ${formatDate(a.date)} at ${formatTime(a.time)}?`;
        
        if (!confirm(confirmMessage)) {
            return; // Stop if Cancel is clicked
        }

        // 2. Process the approval
        a.status = "Approved";
        a.queueStatus = "Waiting";
        syncAppointmentQueue();
        save(STORAGE.appointments, appointments);
        renderAll();
    }

        function renderAppointmentQueue(){
            const container=document.getElementById("appointmentQueueContainer");
            if(!container)return;
            syncAppointmentQueue();
            const queues=appointmentQueue.filter(q=> q.status==="Waiting"|| q.status==="Serving" );
            if(!queues.length){ container.innerHTML=`<div class="empty-state"><i class="fa-solid fa-calendar-check"></i><strong>No appointment patients waiting.</strong><p>Approved appointments will appear here automatically.</p></div>`; return; }
            container.innerHTML=queues.map(q=>`
                <div class="queue-card">
                    <div class="queue-number">${q.number}</div>
                    <div class="queue-details">
                        <h3>${esc(q.patientName)}</h3>
                        <p>${esc(q.service)} · ${formatTime(q.time)}</p>
                        <span class="badge ${statusClass(q.status)}">${q.status}</span>
                    </div>
                    <div class="queue-actions">
                        ${q.status==="Waiting"?`<button class="action-btn primary" onclick="serveAppointment('${q.number}')">Serve</button><button class="action-btn danger" onclick="noShowAppointment('${q.number}')">No-show</button>`:""}
                        ${q.status==="Serving"?`<button class="action-btn success" onclick="completeAppointment('${q.number}')">Complete</button>`:""}
                    </div>
                </div>
            `).join("");
        }

        function serveAppointment(number){
            const active=appointmentQueue.find(q=>q.status==="Serving");
            if(active){ alert(`${active.number} is currently being served.`); return; }
            const q=appointmentQueue.find(x=>x.number===number);
            if(!q)return;
            q.status="Serving";
            const a=appointments.find(x=>x.id===q.appointmentId);
            if(a)a.queueStatus="Serving";
            save(STORAGE.appointmentQueue,appointmentQueue);
            save(STORAGE.appointments,appointments);
            renderAll();
        }

        function completeAppointment(number){
            const q=appointmentQueue.find(x=>x.number===number);
            if(!q)return;
            q.status="Completed";
            const a=appointments.find(x=>x.id===q.appointmentId);
            if(a){ a.queueStatus="Completed"; a.status="Completed"; }

            // Deduction of specific custom materials saved with this appointment
            consumeInventory(q.service, q.appointmentId);

            save(STORAGE.appointmentQueue,appointmentQueue);
            save(STORAGE.appointments,appointments);
            renderAll();
        }

        function noShowAppointment(number){
            const q=appointmentQueue.find(x=>x.number===number);
            if(!q)return;
            q.status="No-show";
            const a=appointments.find(x=>x.id===q.appointmentId);
            if(a){ a.queueStatus="No-show"; a.status="No-show"; }
            save(STORAGE.appointmentQueue,appointmentQueue);
            save(STORAGE.appointments,appointments);
            renderAll();
        }

        /* ================= WALK-IN QUEUE ================= */

        function renderWalkinPatients(){
            const select=document.getElementById("walkinPatient");
            if(!select)return;
            select.innerHTML=`<option value="">Select patient</option>`+ patients.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.id})</option>`).join("");
        }

        function openWalkinModal(patientId=""){
            renderWalkinPatients();
            document.getElementById("walkinPatient").value=patientId;
            
            // RESET Insight Card when opening modal
            const card = document.getElementById("walkinMaterialInsightCard");
            if(card) card.classList.add("hidden");
            temporaryWalkinAdjustments = {};

            document.getElementById("walkinModal").classList.remove("hidden");
        }

        function closeWalkinModal(){ document.getElementById("walkinModal").classList.add("hidden"); }

        function registerPatientWalkin(id){ openAdminPage("walkinQueue"); openWalkinModal(id); }

        document.getElementById("walkinForm").addEventListener("submit",e=>{
            e.preventDefault();
            const patientId=document.getElementById("walkinPatient").value;
            const patient=patients.find(p=>p.id===patientId);
            if(!patient){ alert("Please select a patient."); return; }
            const service=document.getElementById("walkinService").value;
            const walkin={ 
                number:nextQueue("W",walkins), 
                patientId:patient.id, 
                patientName:patient.name, 
                service, 
                time:new Date().toTimeString().slice(0,5), 
                date:today(), 
                status:"Waiting",
                // SAVE CUSTOM QUANTITIES FOR WALK-IN
                customMaterials: { ...temporaryWalkinAdjustments } 
            };
            walkins.push(walkin);
            save(STORAGE.walkins,walkins);
            closeWalkinModal();
            e.target.reset();
            document.getElementById("walkinMaterialInsightCard").classList.add("hidden");
            alert(`${patient.name} added as ${walkin.number}.`);
            renderAll();
        });

        function renderWalkinQueue(){
            const container=document.getElementById("walkinQueueContainer");
            if(!container)return;
            if(!walkins.length){ container.innerHTML=`<div class="empty-state"><i class="fa-solid fa-person-walking"></i><strong>No walk-in patients.</strong><p>Use Add Walk-In to register a patient.</p></div>`; return; }
            container.innerHTML=walkins.map(q=>`
                <div class="queue-card">
                    <div class="queue-number">${q.number}</div>
                    <div class="queue-details">
                        <h3>${esc(q.patientName)}</h3>
                        <p>${esc(q.service)} · ${formatTime(q.time)}</p>
                        <span class="badge ${statusClass(q.status)}">${q.status}</span>
                    </div>
                    <div class="queue-actions">
                        ${q.status==="Waiting"?`<button class="action-btn primary" onclick="serveWalkin('${q.number}')">Serve</button><button class="action-btn danger" onclick="noShowWalkin('${q.number}')">No-show</button>`:""}
                        ${q.status==="Serving"?`<button class="action-btn success" onclick="completeWalkin('${q.number}')">Complete</button>`:""}
                    </div>
                </div>
            `).join("");
        }

        function serveWalkin(number){
            const active=walkins.find(q=>q.status==="Serving");
            if(active){ alert(`${active.number} is currently being served.`); return; }
            const q=walkins.find(x=>x.number===number);
            if(!q)return;
            q.status="Serving";
            save(STORAGE.walkins,walkins);
            renderAll();
        }

        function completeWalkin(number){
            const q=walkins.find(x=>x.number===number);
            if(!q)return;

            q.status="Completed";

            // Deduct exact custom quantities saved during registration
            let materialsToDeduct = q.customMaterials || BOM[q.service] || {};

            Object.entries(materialsToDeduct).forEach(([name, qty]) => {
                const item = inventory.find(x => x.name === name);
                if (item) {
                    item.stock = Math.max(0, item.stock - qty);
                }
            });

            save(STORAGE.inventory, inventory);
            save(STORAGE.walkins,walkins);
            renderAll();
        }

        function noShowWalkin(number){
            const q=walkins.find(x=>x.number===number);
            if(!q)return;
            q.status="No-show";
            save(STORAGE.walkins,walkins);
            renderAll();
        }

        /* ================= DAILY SCHEDULE ================= */

        function renderSchedule(){
            const table=document.getElementById("scheduleTable");
            if(!table)return;
            const appointmentsToday=appointments.filter(a=>a.date===today()).map(a=>({ time:a.time, name:a.patientName, type:"Appointment", service:a.service, status:a.status }));
            const walkinsToday=walkins.filter(w=>w.date===today()).map(w=>({ time:w.time, name:w.patientName, type:"Walk-In", service:w.service, status:w.status }));
            const rows=[...appointmentsToday, ...walkinsToday].sort((a,b)=>a.time.localeCompare(b.time));
            if(!rows.length){ table.innerHTML=`<tr><td colspan="5">No patients scheduled for today.</td></tr>`; return; }
            table.innerHTML=rows.map(r=>`
                <tr>
                    <td>${formatTime(r.time)}</td>
                    <td><strong>${esc(r.name)}</strong></td>
                    <td><span class="badge ${r.type==="Appointment"?"approved":"waiting"}">${r.type}</span></td>
                    <td>${esc(r.service)}</td>
                    <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
                </tr>
            `).join("");
        }

        /* ================= INVENTORY ================= */

        function renderInventory(){
            const table=document.getElementById("inventoryTable");
            if(!table)return;
            table.innerHTML=inventory.map(i=>`
                <tr>
                    <td><strong>${esc(i.name)}</strong></td>
                    <td>${i.stock}</td>
                    <td>${i.minimum}</td>
                    <td><span class="badge ${i.stock<=i.minimum?"no-show":"approved"}">${i.stock<=i.minimum?"Restock":"OK"}</span></td>
                    <td><button class="action-btn success" onclick="openRestockModal('${i.id}')">Edit</button></td>
                </tr>
            `).join("");
        }

        function openRestockModal(id) {
            const item = inventory.find(x => x.id === id);
            if (!item) return;
            document.getElementById("restockId").value = item.id;
            document.getElementById("restockName").value = item.name;
            document.getElementById("restockValue").value = item.stock;
            document.getElementById("restockModal").classList.remove("hidden");
        }

        function closeRestockModal() { document.getElementById("restockModal").classList.add("hidden"); }

        function handleRestockUpdate(e) {
            e.preventDefault();
            const id = document.getElementById("restockId").value;
            const newVal = parseInt(document.getElementById("restockValue").value);
            const item = inventory.find(x => x.id === id);
            if (item) {
                item.stock = newVal;
                save(STORAGE.inventory, inventory); 
                closeRestockModal();
                renderAll(); 
                openAdminPage('inventory');
                alert(`${item.name} stock updated successfully.`);
            }
            return false;
        }

        /* ================= PREDICTIVE FORECAST ================= */

        function getUpcoming(days=30){
            const start=new Date();
            start.setHours(0,0,0,0);
            const end=new Date(start);
            end.setDate(end.getDate()+days);
            return appointments.filter(a=>{
                if(a.status!=="Approved" && a.status!=="Pending")return false;
                const date=new Date(a.date+"T00:00:00");
                return date>=start&&date<=end;
            });
        }

        function calculateForecast(){
            const upcoming=getUpcoming(30);
            const demand={};
            upcoming.forEach(a=>{
                const materials = BOM[a.service] || {};
                Object.entries(materials).forEach(([name, qty]) => { demand[name] = (demand[name] || 0) + qty; });
            });
            return inventory.map(item=>{
                const usage=demand[item.name]||0;
                const projected=item.stock-usage;
                return{ ...item, projectedUsage:usage, projectedStock:projected, warning:projected<=item.minimum };
            });
        }

        function renderForecast(){
            const forecast=calculateForecast();
            const warnings=forecast.filter(x=>x.warning);
            const upcoming=getUpcoming(30);
            document.getElementById("forecastAppointments").textContent= upcoming.length;
            document.getElementById("forecastMaterials").textContent= inventory.length;
            document.getElementById("forecastWarnings").textContent= warnings.length;
            const results=document.getElementById("forecastResults");
            results.innerHTML=forecast.map(x=>`
                <div class="forecast-result ${x.warning?"warning":""}">
                    <strong>${esc(x.name)}</strong>
                    <span>Current Stock: ${x.stock} · Projected Usage: ${x.projectedUsage} · Remaining: ${x.projectedStock} · Supplier Lead Time: ${x.leadTime} days</span>
                    ${x.warning?`<button class="action-btn danger" onclick="suggestRestock('${esc(x.name)}',${x.projectedStock},${x.leadTime})">Suggest Restock</button>`:`<span>✓ Sufficient stock</span>`}
                </div>
            `).join("");
            document.getElementById("forecastSummary").textContent= warnings.length?`${warnings.length} material(s) require restocking.`:"Inventory is sufficient for projected demand.";
        }

        function suggestRestock(name,stock,lead){ alert(`RESTOCK SUGGESTION\n\nMaterial: ${name}\nProjected Remaining: ${stock}\nSupplier Lead Time: ${lead} days\n\nRecommendation: Add ${name} to the next purchase order.`); }

        /* ================= PUBLIC QUEUE ================= */

        function renderPublicQueues(){
            const aBox=document.getElementById("publicAppointmentQueue");
            const wBox=document.getElementById("publicWalkinQueue");
            if(!aBox||!wBox)return;
            syncAppointmentQueue();
            const a = appointmentQueue.filter(q => q.status === "Waiting" || q.status === "Serving");
            const w = walkins.filter(q => q.status === "Waiting" || q.status === "Serving");
            aBox.innerHTML=a.length?a.map(q=>`<div class="queue-card"><div class="queue-number">${q.number}</div><div class="queue-details"><h3>${esc(q.patientName)}</h3><p>${esc(q.service)}</p><span class="badge ${statusClass(q.status)}">${q.status}</span></div></div>`).join(""):`<div class="empty-state">No appointment patients waiting.</div>`;
            wBox.innerHTML=w.length?w.map(q=>`<div class="queue-card"><div class="queue-number">${q.number}</div><div class="queue-details"><h3>${esc(q.patientName)}</h3><p>${esc(q.service)}</p><span class="badge ${statusClass(q.status)}">${q.status}</span></div></div>`).join(""):`<div class="empty-state">No walk-in patients waiting.</div>`;
        }

  /* ================= THE FINAL DATE/TIME VALIDATOR ================= */
const validateClinicSchedule = (dateStr, timeStr) => {
    const now = new Date();
    
    // Parse input date (YYYY-MM-DD) and time (HH:mm)
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    
    const selectedDate = new Date(year, month - 1, day, hour, minute);
    const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedAtMidnight = new Date(year, month - 1, day);

    // 1. DATE CHECK: Is it yesterday or older?
    if (selectedAtMidnight < todayAtMidnight) {
        alert("DATE ERROR: The date you selected has already passed.");
        return false;
    }

    // 2. TIME CHECK: ONLY if the date is TODAY, check if the time passed
    if (selectedAtMidnight.getTime() === todayAtMidnight.getTime()) {
        if (selectedDate <= now) {
            alert("TIME ERROR: This time has already passed for today.");
            return false;
        }
    }

    // 3. CLINIC HOURS (7AM - 8PM) & LUNCH (12PM - 1PM)
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes < 420 || totalMinutes >= 1200) {
        alert("HOURS ERROR: Clinic is open from 7:00 AM to 8:00 PM.");
        return false;
    }
    if (totalMinutes >= 720 && totalMinutes < 780) {
        alert("LUNCH BREAK: Clinic is closed for lunch (12:00 PM - 1:00 PM).");
        return false;
    }

    return true; // Passed! No error message sent for Tomorrow/Future dates.
};

 // THE PATIENT BOOKING LISTENER
document.getElementById("appointmentForm").addEventListener("submit", e => {
    e.preventDefault();

    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    const name = document.getElementById("bookingName").value.trim();
    const contact = document.getElementById("bookingContact").value.trim();
    const service = document.getElementById("bookingService").value;
    const concern = document.getElementById("bookingConcern").value.trim();

    // Use the unified function
    if (!validateClinicBooking(date, time)) {
        return; 
    }

    // Rest of your booking logic...
    let patient = patients.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!patient) {
        patient = { id: nextId("P", patients), name, contact, dob: "", address: "", gender: "", emergency: "", concern, status: "Active" };
        patients.push(patient);
        save(STORAGE.patients, patients);
    }

    const appointment = { id: nextId("APT", appointments), patientId: patient.id, patientName: patient.name, date, time, service, status: "Pending", queueStatus: null };
    appointments.push(appointment);
    save(STORAGE.appointments, appointments);
    
    e.target.reset();
    alert("Appointment submitted successfully.");
    showPublicPage("home");
});

        /* ================= DASHBOARD ================= */

        function renderDashboardCharts() {
            const genderData = {
                Male: patients.filter(p => p.gender === 'Male').length,
                Female: patients.filter(p => p.gender === 'Female').length,
                Other: patients.filter(p => p.gender === 'Other' || !p.gender || p.gender === 'Select').length
            };
            const serviceCounts = {};
            appointments.forEach(a => { serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1; });
            const invLabels = inventory.map(i => i.name);
            const invStock = inventory.map(i => i.stock);
            const invMin = inventory.map(i => i.minimum);
            const ctxGender = document.getElementById('genderChart')?.getContext('2d');
            if (ctxGender) {
                if (genderChartInstance) genderChartInstance.destroy();
                genderChartInstance = new Chart(ctxGender, {
                    type: 'doughnut',
                    data: { labels: Object.keys(genderData), datasets: [{ data: Object.values(genderData), backgroundColor: ['#5b0b68', '#78138a', '#ead3f0'], borderWidth: 0 }] },
                    options: { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }
                });
            }
            const ctxService = document.getElementById('serviceChart')?.getContext('2d');
            if (ctxService) {
                if (serviceChartInstance) serviceChartInstance.destroy();
                serviceChartInstance = new Chart(ctxService, {
                    type: 'bar',
                    data: { labels: Object.keys(serviceCounts), datasets: [{ label: 'Appointments', data: Object.values(serviceCounts), backgroundColor: '#78138a', borderRadius: 5 }] },
                    options: { indexAxis: 'y', plugins: { legend: { display: false } }, maintainAspectRatio: false }
                });
            }
            const ctxInv = document.getElementById('inventoryChart')?.getContext('2d');
            if (ctxInv) {
                if (inventoryChartInstance) inventoryChartInstance.destroy();
                inventoryChartInstance = new Chart(ctxInv, {
                    type: 'bar',
                    data: { labels: invLabels, datasets: [ { label: 'Current Stock', data: invStock, backgroundColor: '#5b0b68' }, { label: 'Min Required', data: invMin, backgroundColor: '#d93434' } ] },
                    options: { scales: { y: { beginAtZero: true } }, maintainAspectRatio: false }
                });
            }
        }

        function renderDashboard() {
        const todayDate = today();
        
        const todayAppointments = appointments.filter(a => a.date === todayDate && a.status !== "Cancelled");
        const waitingAppointments = appointmentQueue.filter(q => q.status === "Waiting" && q.date === todayDate);
        const waitingWalkins = walkins.filter(q => q.status === "Waiting" && q.date === todayDate);
        
        const servingA = appointmentQueue.find(q => q.status === "Serving");
        const servingW = walkins.find(q => q.status === "Serving");
        
        let serving = "None";
        if (servingA) serving = servingA.number;
        else if (servingW) serving = servingW.number;

        // Update the cards
        document.getElementById("statAppointments").textContent = todayAppointments.length;
        document.getElementById("statWaitingAppointments").textContent = waitingAppointments.length;
        document.getElementById("statWaitingWalkins").textContent = waitingWalkins.length;
        document.getElementById("statServing").textContent = serving;
        document.getElementById("statPatients").textContent = patients.length;

        renderDashboardCharts();
    }

        /* ================= DASHBOARD RENDER ================= */

        function renderReports(){
            const totalCompleted = appointmentQueue.filter(q=>q.status==="Completed").length + walkins.filter(q=>q.status==="Completed").length;
            const totalNoShow = appointmentQueue.filter(q=>q.status==="No-show").length + walkins.filter(q=>q.status==="No-show").length;

            document.getElementById("reportPatients").textContent= patients.length;
            document.getElementById("reportAppointments").textContent= appointments.length;
            document.getElementById("reportCompleted").textContent= totalCompleted;
            document.getElementById("reportNoShow").textContent= totalNoShow;

            // Populate the activity log table in reports
            const table = document.getElementById("reportActivityTable");
            if(!table) return;

            const allHistory = [
                ...appointments.map(a => ({ date: a.date, type: 'Appt', name: a.patientName, svc: a.service, stat: a.status })),
                ...walkins.map(w => ({ date: w.date, type: 'Walkin', name: w.patientName, svc: w.service, stat: w.status }))
            ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

            if(!allHistory.length) {
                table.innerHTML = `<tr><td colspan="5">No clinic activity logged.</td></tr>`;
            } else {
                table.innerHTML = allHistory.map(r => `
                    <tr>
                        <td>${formatDate(r.date)}</td>
                        <td><small>${r.type}</small></td>
                        <td><strong>${esc(r.name)}</strong></td>
                        <td>${esc(r.svc || "-")}</td>
                        <td><span class="badge ${statusClass(r.stat)}">${r.stat}</span></td>
                    </tr>
                `).join("");
            }
        }

    /* ================= UPDATED REPORTS RENDER ================= */
    function renderReports() {
        // 1. Update Stat Cards
        const totalCompleted = appointmentQueue.filter(q => q.status === "Completed").length + walkins.filter(q => q.status === "Completed").length;
        const totalNoShow = appointmentQueue.filter(q => q.status === "No-show").length + walkins.filter(q => q.status === "No-show").length;

        document.getElementById("reportPatients").textContent = patients.length;
        document.getElementById("reportAppointments").textContent = appointments.length;
        document.getElementById("reportCompleted").textContent = totalCompleted;
        document.getElementById("reportNoShow").textContent = totalNoShow;

        // 2. Handle Filters
        const filter = document.getElementById("reportFilter").value;
        const tableTitle = document.getElementById("reportTableTitle");
        const tableHeader = document.getElementById("reportTableHeader");
        const tableBody = document.getElementById("reportActivityTable");

        if (filter === "male" || filter === "female") {
            // --- PATIENT GENDER FILTER ---
            const gender = filter === "male" ? "Male" : "Female";
            tableTitle.textContent = `${gender} Patient Directory`;
            tableHeader.innerHTML = `<tr><th>ID</th><th>Patient Name</th><th>Contact</th><th>DOB</th><th>Gender</th></tr>`;
            
            const list = patients.filter(p => p.gender === gender);
            tableBody.innerHTML = list.length ? list.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td><strong>${esc(p.name)}</strong></td>
                    <td>${esc(p.contact)}</td>
                    <td>${formatDate(p.dob)}</td>
                    <td>${p.gender}</td>
                </tr>
            `).join("") : `<tr><td colspan="5">No ${gender} patients found.</td></tr>`;

        } else if (filter === "completed" || filter === "noshow") {
            // --- STATUS FILTER ---
            const status = filter === "completed" ? "Completed" : "No-show";
            tableTitle.textContent = `Full ${status} History`;
            tableHeader.innerHTML = `<tr><th>Date</th><th>Type</th><th>Patient</th><th>Service</th><th>Status</th></tr>`;

            const allHistory = [
                ...appointments.map(a => ({ date: a.date, type: 'Appt', name: a.patientName, svc: a.service, stat: a.status })),
                ...walkins.map(w => ({ date: w.date, type: 'Walkin', name: w.patientName, svc: w.service, stat: w.status }))
            ].filter(item => item.stat === status).sort((a,b) => new Date(b.date) - new Date(a.date));

            tableBody.innerHTML = allHistory.length ? allHistory.map(r => `
                <tr>
                    <td>${formatDate(r.date)}</td>
                    <td><small>${r.type}</small></td>
                    <td><strong>${esc(r.name)}</strong></td>
                    <td>${esc(r.svc || "-")}</td>
                    <td><span class="badge ${statusClass(r.stat)}">${r.stat}</span></td>
                </tr>
            `).join("") : `<tr><td colspan="5">No ${status} records found.</td></tr>`;

        } else {
            // --- DEFAULT: RECENT ACTIVITY ---
            tableTitle.textContent = "Recent Activity Log";
            tableHeader.innerHTML = `<tr><th>Date</th><th>Type</th><th>Patient</th><th>Service</th><th>Status</th></tr>`;

            const allHistory = [
                ...appointments.map(a => ({ date: a.date, type: 'Appt', name: a.patientName, svc: a.service, stat: a.status })),
                ...walkins.map(w => ({ date: w.date, type: 'Walkin', name: w.patientName, svc: w.service, stat: w.status }))
            ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

            tableBody.innerHTML = allHistory.map(r => `
                <tr>
                    <td>${formatDate(r.date)}</td>
                    <td><small>${r.type}</small></td>
                    <td><strong>${esc(r.name)}</strong></td>
                    <td>${esc(r.svc || "-")}</td>
                    <td><span class="badge ${statusClass(r.stat)}">${r.stat}</span></td>
                </tr>
            `).join("");
        }
    }

    /* ================= PRINT CURRENT FILTERED VIEW (CLEAN VERSION) ================= */
    function printFilteredReport() {
        const title = document.getElementById("reportTableTitle").textContent;
        const tableContent = document.querySelector("#page-reports table").outerHTML;
        
        const w = window.open('', '_blank');
        w.document.write(`
            <html>
                <head>
                    <title>Clinic Report</title>
                    <style>
                        /* 1. HIDE BROWSER HEADERS AND FOOTERS */
                        @page {
                            size: auto;
                            margin: 0mm; /* This removes the Date, Title, and URL */
                        }

                        body { 
                            font-family: sans-serif; 
                            padding: 20mm; /* Content margin */
                            margin: 0;
                            counter-reset: page; /* Initialize page counter */
                        }

                        /* 2. CREATE CUSTOM PAGE NUMBER (Simulates browser paging) */
                        .page-footer {
                            position: fixed;
                            bottom: 10mm;
                            right: 15mm;
                            font-size: 11px;
                            color: #777;
                        }
                        
                        /* This adds the "1", "2", etc. at the bottom right */
                        .page-footer::after {
                            counter-increment: page;
                            content: "Page " counter(page);
                        }

                        /* 3. REPORT STYLING */
                        h1 { color: #5b0b68; text-align:center; margin-top: 0; font-size: 24px; }
                        h2 { border-bottom: 2px solid #5b0b68; padding-bottom: 8px; margin-top: 20px; font-size: 18px; }
                        .gen-date { font-size: 12px; color: #555; margin-bottom: 20px; display: block; }
                        
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                        th { background: #f8f8f8; color: #333; }
                        .badge { font-weight: bold; }
                        
                        /* Ensures the footer doesn't overlap table content on long pages */
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    </style>
                </head>
                <body>
                    <!-- The Footer div repeats on every printed page -->
                    <div class="page-footer"></div>

                    <h1>PECAÑA DENTAL CLINIC</h1>
                    <h2>${title}</h2>
                    <span class="gen-date">Report Generated: ${new Date().toLocaleString()}</span>
                    
                    ${tableContent}

                    <script>
                        window.onload = function() { 
                            window.print(); 
                            window.close(); 
                        };
                    </script>
                </body>
            </html>
        `);
        w.document.close();
    }

        /* ================= MASTER RENDER ================= */

function renderAll(){
    syncAppointmentQueue();
    renderDashboard();
    renderPatients();
    renderAppointments();
    renderAppointmentPatients();
    renderAppointmentQueue();
    renderWalkinQueue();
    renderSchedule();
    renderInventory();
    renderForecast();
    renderReports();
    renderPublicQueues();
    
    // SAFE CHECK: Only run these if they actually exist
    if (typeof updatePublicStats === 'function') {
        updatePublicStats();
    }
    if (typeof updatePublicPatientCount === 'function') {
        updatePublicPatientCount(); 
    }
}
        /* ================= START ================= */

    document.addEventListener("DOMContentLoaded", () => {
        syncAppointmentQueue();
        renderAll();
        
        // This physically prevents picking past dates in the browser's date picker
        const todayISO = new Date().toISOString().split('T')[0];
        if (document.getElementById("bookingDate")) document.getElementById("bookingDate").min = todayISO;
        if (document.getElementById("adminAppointmentDate")) document.getElementById("adminAppointmentDate").min = todayISO;
    });
    /* ================= ADVANCE CALENDAR LOGIC ================= */

    let advanceCalendar;

    function openAdvanceCalendar() {
        document.getElementById('calendarModal').classList.remove('hidden');
        const calendarEl = document.getElementById('calendar');
        
        const getApptEvents = () => appointments.map(app => ({ 
            title: `${app.patientName} (${app.service})`, 
            start: `${app.date}T${app.time}`, 
            backgroundColor: app.status === 'Completed' ? '#16834b' : '#5b0b68', 
            borderColor: 'transparent' 
        }));

        const lunchBreak = {
            title: 'Lunch Break',
            startTime: '12:00:00',
            endTime: '13:00:00',
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            display: 'background',
            color: '#ffeded'
        };

        if (!advanceCalendar) {
            advanceCalendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'timeGridWeek',
                headerToolbar: { 
                    left: 'prev,next today', 
                    center: 'title', 
                    right: 'dayGridMonth,timeGridWeek' 
                },
                slotMinTime: '07:00:00',
                slotMaxTime: '21:00:00', // Buffer to 9 PM ensures the 8 PM slot is fully reachable
                contentHeight: 'auto',   // Forces the grid to its natural size
                allDaySlot: false,
                expandRows: true,
                handleWindowResize: true,
                businessHours: [
                    { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '07:00', endTime: '12:00' },
                    { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '13:00', endTime: '20:00' }
                ],
                events: [...getApptEvents(), lunchBreak]
            });
        } else {
            advanceCalendar.removeAllEvents();
            advanceCalendar.addEventSource([...getApptEvents(), lunchBreak]);
        }
        
        advanceCalendar.render();
        setTimeout(() => advanceCalendar.updateSize(), 100);
    }

    function closeCalendarModal() { document.getElementById('calendarModal').classList.add('hidden'); }
    /* ================= NOTIFICATION SYSTEM LOGIC ================= */

    function toggleNotifications(type) {
        const box = type === 'adminNotify' ? document.getElementById('adminNotifyBox') : document.getElementById('patientNotifyBox');
        box.classList.toggle('hidden');
        
        if (type === 'adminNotify') updateAdminNotifications();
    }

    // Close notifications when clicking outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-wrapper')) {
            document.getElementById('adminNotifyBox').classList.add('hidden');
            document.getElementById('patientNotifyBox').classList.add('hidden');
        }
    });

    function updateAdminNotifications() {
        const list = document.getElementById('adminNotifyList');
        const badge = document.getElementById('adminNotifyBadge');
        let notifyCount = 0;
        let html = '';

        // 1. Check Inventory (Out of stock or Low stock)
        inventory.forEach(item => {
            if (item.stock <= item.minimum) {
                notifyCount++;
                // ADDED onclick="openAdminPage('inventory'); toggleNotifications('adminNotify')"
                html += `
                    <div class="notify-item low-stock" onclick="openAdminPage('inventory'); toggleNotifications('adminNotify')">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <div class="notify-content">
                            <b>Low Stock Alert</b>
                            <p>${item.name} is low (${item.stock} left). Click to view inventory.</p>
                        </div>
                    </div>`;
            }
        });

        // 2. Check Pending Appointments
        const pending = appointments.filter(a => a.status === "Pending");
        pending.forEach(a => {
            notifyCount++;
            // ADDED onclick="openAdminPage('appointments'); toggleNotifications('adminNotify')"
            html += `
                <div class="notify-item new-appt" onclick="openAdminPage('appointments'); toggleNotifications('adminNotify')">
                    <i class="fa-solid fa-calendar-plus"></i>
                    <div class="notify-content">
                        <b>New Appointment Request</b>
                        <p>${a.patientName} booked ${a.service} for ${formatDate(a.date)}. Click to manage.</p>
                    </div>
                </div>`;
        });

        if (notifyCount === 0) {
            html = '<p style="padding:20px; text-align:center; font-size:12px; color:#999;">No new notifications</p>';
            badge.classList.add('hidden');
        } else {
            badge.classList.remove('hidden');
            badge.textContent = notifyCount;
        }

        list.innerHTML = html;
    }

    function checkPatientNotifications() {
        const searchVal = document.getElementById('patientNotifySearch').value.trim();
        const list = document.getElementById('patientNotifyList');
        
        if (!searchVal) {
            alert("Please enter your contact number.");
            return;
        }

        // --- MAGIC LINE: Make the result card visible now ---
        list.style.display = 'block';

        const patientMatches = patients.filter(p => p.contact === searchVal);
        const patientIds = patientMatches.map(p => p.id);
        const myAppts = appointments.filter(a => patientIds.includes(a.patientId));

        if (myAppts.length === 0) {
            list.innerHTML = '<p style="padding:20px; text-align:center; font-size:12px; color:#999;">No records found for this number.</p>';
            return;
        }

        let html = '';
        myAppts.forEach(a => {
            let statusIcon = a.status === "Approved" ? "fa-circle-check" : "fa-clock";
            let statusClass = a.status === "Approved" ? "approved" : "";
            
            html += `
                <div class="notify-item ${statusClass}" onclick="showPublicPage('queue-status'); toggleNotifications('patientNotify')">
                    <i class="fa-solid ${statusIcon}"></i>
                    <div class="notify-content">
                        <b>Appointment Status: ${a.status}</b>
                        <p>Service: ${a.service}<br>Schedule: ${formatDate(a.date)} at ${formatTime(a.time)}</p>
                        <small style="color:var(--purple2);">Click to view Queue Status →</small>
                    </div>
                </div>`;
        });

        list.innerHTML = html;
    }

    // Update the admin badge every time the app renders
    const originalRenderAll = renderAll;
    renderAll = function() {
        originalRenderAll();
        updateAdminNotifications();
    };