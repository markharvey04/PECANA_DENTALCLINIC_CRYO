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

    // Validation helper for clinic hours (7AM-8PM, Lunch 12PM-1PM)
    const isValidClinicTime = (t) => {
        if(!t) return false;
        const [h, m] = t.split(":").map(Number);
        const total = h * 60 + m;
        const start = 7 * 60;       // 7:00 AM
        const end = 20 * 60;        // 8:00 PM
        const lunchStart = 12 * 60; // 12:00 PM
        const lunchEnd = 13 * 60;   // 1:00 PM

        if (total < start || total >= end) {
            alert("Clinic hours are 7:00 AM to 8:00 PM.");
            return false;
        }
        if (total >= lunchStart && total < lunchEnd) {
            alert("The clinic is on lunch break from 12:00 PM to 1:00 PM. Please select another time.");
            return false;
        }
        return true;
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

    document.getElementById("loginForm").addEventListener("submit",e=>{
        e.preventDefault();
        const user=document.getElementById("loginUsername").value.trim();
        const pass=document.getElementById("loginPassword").value.trim();
        if((user==="admin"&&pass==="admin123")||(user==="administrator"&&pass==="admin123")){
            document.getElementById("loginPage").classList.add("hidden");
            document.getElementById("publicApp").classList.add("hidden");
            document.getElementById("adminApp").classList.remove("hidden");
            openAdminPage("dashboard");
        }else{
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

        // Reset Material Insight Card when entering Appointment screen
        if (page === 'addAppointment') {
            const card = document.getElementById("materialInsightCard");
            if(card) card.classList.add("hidden");
            temporaryMaterialAdjustments = {};
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
    /* ================= SAVE APPOINTMENT ================= */

    document.getElementById("adminAppointmentForm").addEventListener("submit",e=>{
        e.preventDefault();
        const patientId=document.getElementById("adminAppointmentPatient").value;
        const patient=patients.find(p=>p.id===patientId);
        if(!patient){ alert("Please select a patient."); return; }
        
        const date=document.getElementById("adminAppointmentDate").value;
        const time=document.getElementById("adminAppointmentTime").value;

        // --- ADDED VALIDATION START ---
        if(!isValidClinicTime(time)) return; 
        // --- ADDED VALIDATION END ---

        const service=document.getElementById("adminAppointmentService").value;

        const appointment={
            id:nextId("APT",appointments),
            patientId:patient.id,
            patientName:patient.name,
            date,
            time,
            service,
            status:"Pending",
            queueStatus:null,
            // Save the interactively adjusted materials
            customMaterials: { ...temporaryMaterialAdjustments } 
        };

        appointments.push(appointment);
        save(STORAGE.appointments,appointments);
        e.target.reset();
        
        const card = document.getElementById("materialInsightCard");
        if(card) card.classList.add("hidden");

        alert("Appointment created successfully.");
        openAdminPage("appointments");
    });

    /* ================= PATIENTS ================= */

    document.getElementById("patientForm").addEventListener("submit",e=>{
        e.preventDefault();
        const name=document.getElementById("patientName").value.trim();
        if(!name){ alert("Please enter the patient's name."); return; }
        const duplicate=patients.some(p=>p.name.toLowerCase()===name.toLowerCase());
        if(duplicate){ alert("This patient is already registered."); return; }

        const patient={
            id:nextId("P",patients),
            name,
            contact:document.getElementById("patientContact").value.trim(),
            dob:document.getElementById("patientDOB").value,
            gender:document.getElementById("patientGender").value,
            address:document.getElementById("patientAddress").value.trim(),
            emergency:document.getElementById("patientEmergency").value.trim(),
            concern:document.getElementById("patientConcern").value.trim(),
            status:"Active"
        };

        patients.push(patient);
        save(STORAGE.patients,patients);
        e.target.reset();
        alert(`${patient.name} was successfully registered.`);
        openAdminPage("patients");
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

    function closePatientModal(){ document.getElementById("patientModal").classList.add("hidden"); }

    function renderPatients(){
        const table=document.getElementById("patientTable");
        if(!table)return;
        if(!patients.length){ table.innerHTML=`<tr><td colspan="7">No patients registered.</td></tr>`; return; }
        table.innerHTML=patients.map(p=>`
            <tr>
                <td>${p.id}</td>
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.contact)}</td>
                <td>${formatDate(p.dob)}</td>
                <td>${esc(p.concern||"-")}</td>
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

    function createAppointmentFor(id){
        openAdminPage("addAppointment");
        document.getElementById("adminAppointmentPatient").value=id;
    }

    function renderAppointments(){
        const table=document.getElementById("appointmentTable");
        if(!table)return;
        if(!appointments.length){ table.innerHTML=`<tr><td colspan="7">No appointments found.</td></tr>`; return; }
        const sorted=[...appointments].sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
        table.innerHTML=sorted.map(a=>`
            <tr>
                <td>${a.id}</td>
                <td><strong>${esc(a.patientName)}</strong></td>
                <td>${formatDate(a.date)}</td>
                <td>${formatTime(a.time)}</td>
                <td>${esc(a.service)}</td>
                <td><span class="badge ${statusClass(a.status)}">${a.status}</span></td>
                <td>
                    ${a.status==="Pending"?`<button class="action-btn success" onclick="approveAppointment('${a.id}')">Approve</button>`:""}
                    ${a.status==="Approved"?`<button class="action-btn primary" onclick="openAdminPage('appointmentQueue')">Queue</button>`:""}
                </td>
            </tr>
        `).join("");
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

    function approveAppointment(id){
        const a=appointments.find(x=>x.id===id);
        if(!a)return;
        a.status="Approved";
        a.queueStatus="Waiting";
        syncAppointmentQueue();
        save(STORAGE.appointments,appointments);
        alert(`${a.patientName} is approved and added to the Appointment Queue.`);
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
                <td>${i.leadTime} days</td>
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

    /* ================= PUBLIC BOOKING ================= */

    document.getElementById("appointmentForm").addEventListener("submit",e=>{
        e.preventDefault();
        const name=document.getElementById("bookingName").value.trim();
        const contact=document.getElementById("bookingContact").value.trim();
        const date=document.getElementById("bookingDate").value;
        const time=document.getElementById("bookingTime").value;

        // --- ADDED VALIDATION START ---
        if(!isValidClinicTime(time)) return; 
        // --- ADDED VALIDATION END ---

        const service=document.getElementById("bookingService").value;
        const concern=document.getElementById("bookingConcern").value.trim();
        let patient=patients.find(p=>p.name.toLowerCase()===name.toLowerCase());
        if(!patient){
            patient={ id:nextId("P",patients), name, contact, dob:"", address:"", gender:"", emergency:"", concern, status:"Active" };
            patients.push(patient);
            save(STORAGE.patients,patients);
        }
        const appointment={ id:nextId("APT",appointments), patientId:patient.id, patientName:patient.name, date, time, service, status:"Pending", queueStatus:null };
        appointments.push(appointment);
        save(STORAGE.appointments,appointments);
        e.target.reset();
        alert("Appointment submitted successfully.\n\nClinic staff will review and approve your appointment.");
        showPublicPage("home");
    });

    function selectService(service){ showPublicPage("appointment"); document.getElementById("bookingService").value=service; }

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

    function renderDashboard(){
        const todayAppointments=appointments.filter( a=>a.date===today()&& a.status!=="Cancelled" );
        const waitingAppointments=appointmentQueue.filter( q=>q.status==="Waiting" && q.date===today() );
        const waitingWalkins=walkins.filter( q=>q.status==="Waiting" && q.date===today() );
        const servingA=appointmentQueue.find( q=>q.status==="Serving" );
        const servingW=walkins.find( q=>q.status==="Serving" );
        let serving="None";
        if(servingA)serving=servingA.number;
        if(servingW)serving=servingW.number;
        document.getElementById("statAppointments").textContent= todayAppointments.length;
        document.getElementById("statWaitingAppointments").textContent= waitingAppointments.length;
        document.getElementById("statWaitingWalkins").textContent= waitingWalkins.length;
        document.getElementById("statServing").textContent= serving;
        document.getElementById("statPatients").textContent= patients.length;
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

    /* ================= MASTER PRINT FUNCTION ================= */

    function printReport(type) {
        let printContent = "";
        let title = "";

        if (type === 'summary') {
            title = "Clinic Management Summary";
            printContent = `
                <div class="print-stats">
                    <div class="p-card"><h3>Patients</h3><p>${patients.length}</p></div>
                    <div class="p-card"><h3>Appointments</h3><p>${appointments.length}</p></div>
                    <div class="p-card"><h3>Completed</h3><p>${document.getElementById("reportCompleted").textContent}</p></div>
                </div>
                <h4>Activity Log Preview</h4>
                <table class="print-table">${document.querySelector("#reportActivityTable").closest('table').innerHTML}</table>
            `;
        } else if (type === 'patients') {
            title = "Patient Directory";
            printContent = `
                <table class="print-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Concern</th></tr></thead>
                    <tbody>${patients.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.contact}</td><td>${p.concern || '-'}</td></tr>`).join('')}</tbody>
                </table>
            `;
        } else if (type === 'activity') {
            title = "Complete Activity Log";
            printContent = `<table class="print-table">${document.querySelector("#reportActivityTable").closest('table').innerHTML}</table>`;
        }

        const w = window.open('', '_blank');
        w.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        /* Removes browser headers and footers */
                        @page { size: auto; margin: 0mm; }
                        body { font-family: sans-serif; padding: 20mm; margin: 0; }
                        .header { text-align: center; border-bottom: 2px solid #5b0b68; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { color: #5b0b68; margin: 0; }
                        .print-stats { display: flex; gap: 20px; margin-bottom: 30px; }
                        .p-card { flex: 1; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                        .p-card h3 { margin: 0; font-size: 14px; color: #666; }
                        .p-card p { font-size: 24px; font-weight: bold; margin: 5px 0 0; color: #5b0b68; }
                        .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .print-table th, .print-table td { border: 1px solid #eee; padding: 12px; text-align: left; font-size: 13px; }
                        .print-table th { background: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>PECAÑA DENTAL CLINIC</h1>
                        <p>${title}</p>
                        <small>Printed: ${new Date().toLocaleString()}</small>
                    </div>
                    ${printContent}
                    
                    <script>
                        // This listener detects when the print dialog is closed (either by Printing or Cancelling)
                        window.onafterprint = function() {
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        w.document.close();

        setTimeout(() => { 
            w.print(); 
            w.close(); 
        }, 500);
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
        updatePublicStats();
    }

    /* ================= START ================= */

    document.addEventListener("DOMContentLoaded",()=>{
        syncAppointmentQueue();
        renderAll();
        const bookingDate=document.getElementById("bookingDate");
        const adminDate=document.getElementById("adminAppointmentDate");
        if(bookingDate)bookingDate.min=today();
        if(adminDate)adminDate.min=today();
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