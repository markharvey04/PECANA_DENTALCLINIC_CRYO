const STORAGE={
    patients:"pecana_patients",
    appointments:"pecana_appointments",
    appointmentQueue:"pecana_appointment_queue",
    walkins:"pecana_walkin_queue",
    inventory:"pecana_inventory"
};

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

let patients=load(STORAGE.patients,[
    {
        id:"P001",
        name:"Juan Dela Cruz",
        contact:"09171234567",
        dob:"2000-05-15",
        address:"Polangui, Albay",
        gender:"Male",
        emergency:"Maria Dela Cruz",
        concern:"Regular dental check-up",
        status:"Active"
    },
    {
        id:"P002",
        name:"Maria Santos",
        contact:"09181234567",
        dob:"1999-08-22",
        address:"Polangui, Albay",
        gender:"Female",
        emergency:"Pedro Santos",
        concern:"Tooth cleaning",
        status:"Active"
    },
    {
        id:"P003",
        name:"Carlos Reyes",
        contact:"09191234567",
        dob:"2001-02-10",
        address:"Polangui, Albay",
        gender:"Male",
        emergency:"Ana Reyes",
        concern:"Tooth pain",
        status:"Active"
    }
]);

let appointments=load(STORAGE.appointments,[
    {
        id:"APT001",
        patientId:"P001",
        patientName:"Juan Dela Cruz",
        date:today(),
        time:"09:00",
        service:"Dental Check-up",
        status:"Approved",
        queueStatus:"Waiting"
    }
]);

let appointmentQueue=load(STORAGE.appointmentQueue,[
    {
        number:"A001",
        appointmentId:"APT001",
        patientId:"P001",
        patientName:"Juan Dela Cruz",
        service:"Dental Check-up",
        time:"09:00",
        date:today(),
        status:"Waiting"
    }
]);

let walkins=load(STORAGE.walkins,[]);

let inventory=load(STORAGE.inventory,[
    {id:"I001",name:"Composite Resin",stock:12,minimum:5,leadTime:5,usage:1},
    {id:"I002",name:"Dental Floss",stock:10,minimum:5,leadTime:3,usage:1},
    {id:"I003",name:"Bonding Agent",stock:8,minimum:3,leadTime:5,usage:1},
    {id:"I004",name:"Suture Material",stock:15,minimum:5,leadTime:4,usage:1}
]);

/* ================= PUBLIC NAVIGATION ================= */

function showPublicPage(page){
    document.getElementById("publicApp").classList.remove("hidden");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("adminApp").classList.add("hidden");

    document.querySelectorAll(".public-page")
        .forEach(x=>x.classList.remove("active"));

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

function logout(){
    showPublicSite();
}

/* ================= LOGIN ================= */

document.getElementById("loginForm").addEventListener("submit",e=>{
    e.preventDefault();

    const user=document.getElementById("loginUsername").value.trim();
    const pass=document.getElementById("loginPassword").value.trim();

    if(
        (user==="admin"&&pass==="admin123")||
        (user==="administrator"&&pass==="admin123")
    ){
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("publicApp").classList.add("hidden");
        document.getElementById("adminApp").classList.remove("hidden");
        openAdminPage("dashboard");
    }else{
        alert("Invalid login.\n\nDemo account:\nUsername: admin\nPassword: admin123");
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
    document.querySelectorAll(".admin-page")
        .forEach(x=>x.classList.remove("active"));

    const target=document.getElementById("page-"+page);
    if(!target)return;

    target.classList.add("active");

    document.querySelectorAll(".side-link")
        .forEach(x=>x.classList.remove("active"));

    const nav=document.querySelector(`.side-link[data-page="${page}"]`);
    if(nav)nav.classList.add("active");

    document.getElementById("pageTitle").textContent=
        pageNames[page]||"Dashboard";

    renderAll();
}

document.querySelectorAll(".side-link[data-page]").forEach(btn=>{
    btn.addEventListener("click",()=>{
        openAdminPage(btn.dataset.page);
    });
});

/* ================= PATIENTS ================= */

document.getElementById("patientForm").addEventListener("submit",e=>{
    e.preventDefault();

    const name=document.getElementById("patientName").value.trim();

    if(!name){
        alert("Please enter the patient's name.");
        return;
    }

    const duplicate=patients.some(
        p=>p.name.toLowerCase()===name.toLowerCase()
    );

    if(duplicate){
        alert("This patient is already registered.");
        return;
    }

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

function closePatientModal(){
    document.getElementById("patientModal").classList.add("hidden");
}

function renderPatients(){
    const table=document.getElementById("patientTable");
    if(!table)return;

    if(!patients.length){
        table.innerHTML=`<tr><td colspan="7">No patients registered.</td></tr>`;
        return;
    }

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

    select.innerHTML=
        `<option value="">Select patient</option>`+
        patients.map(p=>`
            <option value="${p.id}">
                ${esc(p.name)} (${p.id})
            </option>
        `).join("");

    if(patients.some(p=>p.id===selected))
        select.value=selected;
}

function createAppointmentFor(id){
    openAdminPage("addAppointment");
    document.getElementById("adminAppointmentPatient").value=id;
}

document.getElementById("adminAppointmentForm").addEventListener("submit",e=>{
    e.preventDefault();

    const patientId=document.getElementById("adminAppointmentPatient").value;
    const patient=patients.find(p=>p.id===patientId);

    if(!patient){
        alert("Please select a patient.");
        return;
    }

    const date=document.getElementById("adminAppointmentDate").value;
    const time=document.getElementById("adminAppointmentTime").value;

    const conflict=appointments.some(a=>
        a.date===date &&
        a.time===time &&
        a.status!=="Cancelled" &&
        a.status!=="Completed" &&
        a.status!=="No-show"
    );

    if(conflict){
        alert("That time slot is already occupied.");
        return;
    }

    const appointment={
        id:nextId("APT",appointments),
        patientId:patient.id,
        patientName:patient.name,
        date,
        time,
        service:document.getElementById("adminAppointmentService").value,
        status:"Pending",
        queueStatus:null
    };

    appointments.push(appointment);
    save(STORAGE.appointments,appointments);

    e.target.reset();

    alert("Appointment created successfully.");
    openAdminPage("appointments");
});

function renderAppointments(){
    const table=document.getElementById("appointmentTable");
    if(!table)return;

    if(!appointments.length){
        table.innerHTML=`<tr><td colspan="7">No appointments found.</td></tr>`;
        return;
    }

    const sorted=[...appointments].sort(
        (a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );

    table.innerHTML=sorted.map(a=>`
        <tr>
            <td>${a.id}</td>
            <td><strong>${esc(a.patientName)}</strong></td>
            <td>${formatDate(a.date)}</td>
            <td>${formatTime(a.time)}</td>
            <td>${esc(a.service)}</td>
            <td>
                <span class="badge ${statusClass(a.status)}">
                    ${a.status}
                </span>
            </td>
            <td>
                ${a.status==="Pending"
                    ?`<button class="action-btn success"
                        onclick="approveAppointment('${a.id}')">
                        Approve
                       </button>`
                    :""}

                ${a.status==="Approved"
                    ?`<button class="action-btn primary"
                        onclick="openAdminPage('appointmentQueue')">
                        Queue
                       </button>`
                    :""}
            </td>
        </tr>
    `).join("");
}

/* ================= APPOINTMENT QUEUE INTEGRATION ================= */

function syncAppointmentQueue(){

    appointments.forEach(a=>{

        let q=appointmentQueue.find(
            x=>x.appointmentId===a.id
        );

        /*
         * IMPORTANT:
         * Approved + Waiting appointment MUST exist
         * in the appointment queue.
         */
        if(
            a.status==="Approved" &&
            (a.queueStatus==="Waiting"||a.queueStatus==="Serving")
        ){

            if(!q){
                q={
                    number:nextQueue("A",appointmentQueue),
                    appointmentId:a.id,
                    patientId:a.patientId,
                    patientName:a.patientName,
                    service:a.service,
                    time:a.time,
                    date:a.date,
                    status:a.queueStatus
                };

                appointmentQueue.push(q);
            }else{
                q.patientId=a.patientId;
                q.patientName=a.patientName;
                q.service=a.service;
                q.time=a.time;
                q.date=a.date;
                q.status=a.queueStatus;
            }
        }

        if(q){
            if(a.status==="Completed"){
                q.status="Completed";
            }

            if(a.status==="No-show"){
                q.status="No-show";
            }
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

    const queues=appointmentQueue.filter(q=>
        q.status==="Waiting"||
        q.status==="Serving"
    );

    if(!queues.length){
        container.innerHTML=`
            <div class="empty-state">
                <i class="fa-solid fa-calendar-check"></i>
                <strong>No appointment patients waiting.</strong>
                <p>Approved appointments will appear here automatically.</p>
            </div>`;
        return;
    }

    container.innerHTML=queues.map(q=>`
        <div class="queue-card">
            <div class="queue-number">${q.number}</div>

            <div class="queue-details">
                <h3>${esc(q.patientName)}</h3>
                <p>
                    ${esc(q.service)}
                    · ${formatTime(q.time)}
                </p>
                <span class="badge ${statusClass(q.status)}">
                    ${q.status}
                </span>
            </div>

            <div class="queue-actions">
                ${q.status==="Waiting"
                    ?`
                    <button class="action-btn primary"
                        onclick="serveAppointment('${q.number}')">
                        Serve
                    </button>

                    <button class="action-btn danger"
                        onclick="noShowAppointment('${q.number}')">
                        No-show
                    </button>`
                    :""
                }

                ${q.status==="Serving"
                    ?`
                    <button class="action-btn success"
                        onclick="completeAppointment('${q.number}')">
                        Complete
                    </button>`
                    :""
                }
            </div>
        </div>
    `).join("");
}

function serveAppointment(number){

    const active=appointmentQueue.find(q=>q.status==="Serving");

    if(active){
        alert(`${active.number} is currently being served.`);
        return;
    }

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

    if(a){
        a.queueStatus="Completed";
        a.status="Completed";
    }

    consumeInventory(q.service);

    save(STORAGE.appointmentQueue,appointmentQueue);
    save(STORAGE.appointments,appointments);

    renderAll();
}

function noShowAppointment(number){

    const q=appointmentQueue.find(x=>x.number===number);
    if(!q)return;

    q.status="No-show";

    const a=appointments.find(x=>x.id===q.appointmentId);

    if(a){
        a.queueStatus="No-show";
        a.status="No-show";
    }

    save(STORAGE.appointmentQueue,appointmentQueue);
    save(STORAGE.appointments,appointments);

    renderAll();
}

/* ================= WALK-IN QUEUE ================= */

function renderWalkinPatients(){
    const select=document.getElementById("walkinPatient");
    if(!select)return;

    select.innerHTML=
        `<option value="">Select patient</option>`+
        patients.map(p=>`
            <option value="${p.id}">
                ${esc(p.name)} (${p.id})
            </option>
        `).join("");
}

function openWalkinModal(patientId=""){
    renderWalkinPatients();

    document.getElementById("walkinPatient").value=patientId;

    document.getElementById("walkinModal")
        .classList.remove("hidden");
}

function closeWalkinModal(){
    document.getElementById("walkinModal")
        .classList.add("hidden");
}

function registerPatientWalkin(id){
    openAdminPage("walkinQueue");
    openWalkinModal(id);
}

document.getElementById("walkinForm").addEventListener("submit",e=>{
    e.preventDefault();

    const patientId=document.getElementById("walkinPatient").value;
    const patient=patients.find(p=>p.id===patientId);

    if(!patient){
        alert("Please select a patient.");
        return;
    }

    const service=document.getElementById("walkinService").value;

    const walkin={
        number:nextQueue("W",walkins),
        patientId:patient.id,
        patientName:patient.name,
        service,
        time:new Date().toTimeString().slice(0,5),
        date:today(),
        status:"Waiting"
    };

    walkins.push(walkin);
    save(STORAGE.walkins,walkins);

    closeWalkinModal();
    e.target.reset();

    alert(`${patient.name} added as ${walkin.number}.`);

    renderAll();
});

function renderWalkinQueue(){
    const container=document.getElementById("walkinQueueContainer");
    if(!container)return;

    if(!walkins.length){
        container.innerHTML=`
            <div class="empty-state">
                <i class="fa-solid fa-person-walking"></i>
                <strong>No walk-in patients.</strong>
                <p>Use Add Walk-In to register a patient.</p>
            </div>`;
        return;
    }

    container.innerHTML=walkins.map(q=>`
        <div class="queue-card">
            <div class="queue-number">${q.number}</div>

            <div class="queue-details">
                <h3>${esc(q.patientName)}</h3>
                <p>${esc(q.service)} · ${formatTime(q.time)}</p>
                <span class="badge ${statusClass(q.status)}">
                    ${q.status}
                </span>
            </div>

            <div class="queue-actions">

                ${q.status==="Waiting"
                    ?`
                    <button class="action-btn primary"
                        onclick="serveWalkin('${q.number}')">
                        Serve
                    </button>

                    <button class="action-btn danger"
                        onclick="noShowWalkin('${q.number}')">
                        No-show
                    </button>`
                    :""
                }

                ${q.status==="Serving"
                    ?`
                    <button class="action-btn success"
                        onclick="completeWalkin('${q.number}')">
                        Complete
                    </button>`
                    :""
                }
            </div>
        </div>
    `).join("");
}

function serveWalkin(number){

    const active=walkins.find(q=>q.status==="Serving");

    if(active){
        alert(`${active.number} is currently being served.`);
        return;
    }

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

    consumeInventory(q.service);

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

    const appointmentsToday=appointments
        .filter(a=>a.date===today())
        .map(a=>({
            time:a.time,
            name:a.patientName,
            type:"Appointment",
            service:a.service,
            status:a.status
        }));

    const walkinsToday=walkins
        .filter(w=>w.date===today())
        .map(w=>({
            time:w.time,
            name:w.patientName,
            type:"Walk-In",
            service:w.service,
            status:w.status
        }));

    const rows=[
        ...appointmentsToday,
        ...walkinsToday
    ].sort((a,b)=>a.time.localeCompare(b.time));

    if(!rows.length){
        table.innerHTML=`
            <tr>
                <td colspan="5">No patients scheduled for today.</td>
            </tr>`;
        return;
    }

    table.innerHTML=rows.map(r=>`
        <tr>
            <td>${formatTime(r.time)}</td>
            <td><strong>${esc(r.name)}</strong></td>
            <td>
                <span class="badge ${r.type==="Appointment"?"approved":"waiting"}">
                    ${r.type}
                </span>
            </td>
            <td>${esc(r.service)}</td>
            <td>
                <span class="badge ${statusClass(r.status)}">
                    ${r.status}
                </span>
            </td>
        </tr>
    `).join("");
}

/* ================= INVENTORY ================= */

const BOM={
    "Dental Check-up":{"Dental Floss":1},
    "Dental Cleaning":{"Dental Floss":1},
    "Tooth Restoration":{
        "Composite Resin":1,
        "Bonding Agent":1
    },
    "Tooth Extraction":{
        "Suture Material":1
    }
};

function consumeInventory(service){

    const materials=BOM[service]||{};

    Object.entries(materials).forEach(([name,amount])=>{
        const item=inventory.find(x=>x.name===name);

        if(item){
            item.stock=Math.max(0,item.stock-amount);
        }
    });

    save(STORAGE.inventory,inventory);
}

function renderInventory(){

    const table=document.getElementById("inventoryTable");
    if(!table)return;

    table.innerHTML=inventory.map(i=>`
        <tr>
            <td><strong>${esc(i.name)}</strong></td>
            <td>${i.stock}</td>
            <td>${i.minimum}</td>
            <td>${i.leadTime} days</td>
            <td>
                <span class="badge ${i.stock<=i.minimum?"no-show":"approved"}">
                    ${i.stock<=i.minimum?"Restock":"OK"}
                </span>
            </td>
        </tr>
    `).join("");
}

/* ================= PREDICTIVE FORECAST ================= */

function getUpcoming(days=30){

    const start=new Date();
    start.setHours(0,0,0,0);

    const end=new Date(start);
    end.setDate(end.getDate()+days);

    return appointments.filter(a=>{
        if(
            a.status!=="Approved" &&
            a.status!=="Pending"
        )return false;

        const date=new Date(a.date+"T00:00:00");

        return date>=start&&date<=end;
    });
}

function calculateForecast(){

    const upcoming=getUpcoming(30);
    const demand={};

    upcoming.forEach(a=>{
        const materials=BOM[a.service]||{};

        Object.entries(materials).forEach(([name,qty])=>{
            demand[name]=(demand[name]||0)+qty;
        });
    });

    return inventory.map(item=>{

        const usage=demand[item.name]||0;
        const projected=item.stock-usage;

        /*
         * Lead time warning:
         * if projected stock reaches/below minimum,
         * recommend ordering before the lead time expires.
         */

        return{
            ...item,
            projectedUsage:usage,
            projectedStock:projected,
            warning:projected<=item.minimum
        };
    });
}

function renderForecast(){

    const forecast=calculateForecast();
    const warnings=forecast.filter(x=>x.warning);
    const upcoming=getUpcoming(30);

    document.getElementById("forecastAppointments").textContent=
        upcoming.length;

    document.getElementById("forecastMaterials").textContent=
        inventory.length;

    document.getElementById("forecastWarnings").textContent=
        warnings.length;

    const results=document.getElementById("forecastResults");

    results.innerHTML=forecast.map(x=>`
        <div class="forecast-result ${x.warning?"warning":""}">
            <strong>${esc(x.name)}</strong>

            <span>
                Current Stock: ${x.stock}
                · Projected Usage: ${x.projectedUsage}
                · Remaining: ${x.projectedStock}
                · Supplier Lead Time: ${x.leadTime} days
            </span>

            ${
                x.warning
                ?`
                <button class="action-btn danger"
                    onclick="suggestRestock('${esc(x.name)}',${x.projectedStock},${x.leadTime})">
                    Suggest Restock
                </button>`
                :`<span>✓ Sufficient stock</span>`
            }
        </div>
    `).join("");

    document.getElementById("forecastSummary").textContent=
        warnings.length
        ?`${warnings.length} material(s) require restocking.`
        :"Inventory is sufficient for projected demand.";
}

function suggestRestock(name,stock,lead){
    alert(
        `RESTOCK SUGGESTION\n\n`+
        `Material: ${name}\n`+
        `Projected Remaining: ${stock}\n`+
        `Supplier Lead Time: ${lead} days\n\n`+
        `Recommendation: Add ${name} to the next purchase order.`
    );
}

/* ================= PUBLIC QUEUE ================= */

function renderPublicQueues(){

    const aBox=document.getElementById("publicAppointmentQueue");
    const wBox=document.getElementById("publicWalkinQueue");

    if(!aBox||!wBox)return;

    syncAppointmentQueue();

    const a=appointmentQueue.filter(q=>
        q.status==="Waiting"||q.status==="Serving"
    );

    const w=walkins.filter(q=>
        q.status==="Waiting"||q.status==="Serving"
    );

    aBox.innerHTML=a.length?a.map(q=>`
        <div class="queue-card">
            <div class="queue-number">${q.number}</div>
            <div class="queue-details">
                <h3>${esc(q.patientName)}</h3>
                <p>${esc(q.service)}</p>
                <span class="badge ${statusClass(q.status)}">${q.status}</span>
            </div>
        </div>
    `).join(""):`<div class="empty-state">No appointment patients waiting.</div>`;

    wBox.innerHTML=w.length?w.map(q=>`
        <div class="queue-card">
            <div class="queue-number">${q.number}</div>
            <div class="queue-details">
                <h3>${esc(q.patientName)}</h3>
                <p>${esc(q.service)}</p>
                <span class="badge ${statusClass(q.status)}">${q.status}</span>
            </div>
        </div>
    `).join(""):`<div class="empty-state">No walk-in patients waiting.</div>`;
}

/* ================= PUBLIC BOOKING ================= */

document.getElementById("appointmentForm").addEventListener("submit",e=>{
    e.preventDefault();

    const name=document.getElementById("bookingName").value.trim();
    const contact=document.getElementById("bookingContact").value.trim();
    const date=document.getElementById("bookingDate").value;
    const time=document.getElementById("bookingTime").value;
    const service=document.getElementById("bookingService").value;
    const concern=document.getElementById("bookingConcern").value.trim();

    let patient=patients.find(
        p=>p.name.toLowerCase()===name.toLowerCase()
    );

    if(!patient){
        patient={
            id:nextId("P",patients),
            name,
            contact,
            dob:"",
            address:"",
            gender:"",
            emergency:"",
            concern,
            status:"Active"
        };

        patients.push(patient);
        save(STORAGE.patients,patients);
    }

    const appointment={
        id:nextId("APT",appointments),
        patientId:patient.id,
        patientName:patient.name,
        date,
        time,
        service,
        status:"Pending",
        queueStatus:null
    };

    appointments.push(appointment);
    save(STORAGE.appointments,appointments);

    e.target.reset();

    alert(
        "Appointment submitted successfully.\n\n"+
        "Clinic staff will review and approve your appointment."
    );

    showPublicPage("home");
});

function selectService(service){
    showPublicPage("appointment");
    document.getElementById("bookingService").value=service;
}

/* ================= DASHBOARD ================= */

function renderDashboard(){

    const todayAppointments=appointments.filter(
        a=>a.date===today()&&
        a.status!=="Cancelled"
    );

    const waitingAppointments=appointmentQueue.filter(
        q=>q.status==="Waiting" &&
        q.date===today()
    );

    const waitingWalkins=walkins.filter(
        q=>q.status==="Waiting" &&
        q.date===today()
    );

    const servingA=appointmentQueue.find(
        q=>q.status==="Serving"
    );

    const servingW=walkins.find(
        q=>q.status==="Serving"
    );

    let serving="None";

    if(servingA)serving=servingA.number;
    if(servingW)serving=servingW.number;

    document.getElementById("statAppointments").textContent=
        todayAppointments.length;

    document.getElementById("statWaitingAppointments").textContent=
        waitingAppointments.length;

    document.getElementById("statWaitingWalkins").textContent=
        waitingWalkins.length;

    document.getElementById("statServing").textContent=
        serving;

    document.getElementById("statPatients").textContent=
        patients.length;
}

/* ================= REPORTS ================= */

function renderReports(){

    document.getElementById("reportPatients").textContent=
        patients.length;

    document.getElementById("reportAppointments").textContent=
        appointments.length;

    document.getElementById("reportCompleted").textContent=
        appointmentQueue.filter(q=>q.status==="Completed").length+
        walkins.filter(q=>q.status==="Completed").length;

    document.getElementById("reportNoShow").textContent=
        appointmentQueue.filter(q=>q.status==="No-show").length+
        walkins.filter(q=>q.status==="No-show").length;
}

function updatePublicStats(){

    const p=document.getElementById("publicPatientCount");
    const a=document.getElementById("publicAppointmentCount");

    if(p)p.textContent=patients.length;
    if(a)a.textContent=appointments.length;
}

/* ================= MASTER RENDER ================= */

function renderAll(){

    syncAppointmentQueue();

    renderDashboard();
    renderPatients();
    renderAppointments();
    renderAppointmentPatients();
    renderAppointmentQueue();
    renderWalkinPatients();
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