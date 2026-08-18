/* ================= DATA ================= */

let appointments=[
  {
    id:1,
    name:"Maria Santos",
    phone:"09171112222",
    service:"Cleaning",
    date:todayPlus(1),
    status:"Pending"
  },
  {
    id:2,
    name:"Juan Dela Cruz",
    phone:"09173334444",
    service:"Extraction",
    date:todayPlus(2),
    status:"Approved"
  }
];

let queue=[
  {
    id:"A-001",
    appointmentId:2,
    name:"Juan Dela Cruz",
    service:"Extraction",
    status:"Waiting"
  }
];

let inventory=[
  {
    id:1,
    name:"Dental Floss",
    stock:10,
    threshold:5,
    lead:5,
    supplier:"Preferred Dental Supplier",
    unit:"units"
  },
  {
    id:2,
    name:"Composite Resin",
    stock:20,
    threshold:8,
    lead:5,
    supplier:"Dental Materials Supply",
    unit:"units"
  },
  {
    id:3,
    name:"Anesthetic Cartridge",
    stock:30,
    threshold:10,
    lead:7,
    supplier:"Medical Dental Supply",
    unit:"cartridges"
  },
  {
    id:4,
    name:"Suture",
    stock:15,
    threshold:5,
    lead:5,
    supplier:"Dental Surgical Supply",
    unit:"packs"
  }
];


/* ================= BOM ================= */

/*
  Procedure = materials consumed per completed procedure.
*/

const BOM={
  Cleaning:{
    "Dental Floss":1
  },

  Extraction:{
    "Anesthetic Cartridge":1,
    "Suture":1
  },

  Filling:{
    "Composite Resin":1,
    "Dental Floss":1,
    "Anesthetic Cartridge":1
  },

  "Root Canal":{
    "Composite Resin":2,
    "Dental Floss":1,
    "Anesthetic Cartridge":2
  }
};


/* ================= NAVIGATION ================= */

function page(name){

  document.querySelectorAll(".page")
    .forEach(x=>x.classList.remove("active"));

  document.getElementById(name)
    .classList.add("active");

  if(name==="queue")
    renderQueue();
}


/* ================= HELPERS ================= */

function todayPlus(days){

  let d=new Date();

  d.setDate(d.getDate()+days);

  return d.toISOString().split("T")[0];
}

function dateLimit(days){

  let d=new Date();

  d.setDate(d.getDate()+days);

  return d;
}


/* ================= APPOINTMENTS ================= */

function book(service){

  page("appointment");

  document.getElementById("service").value=service;
}

function addAppointment(e){

  e.preventDefault();

  appointments.push({
    id:appointments.length+1,
    name:document.getElementById("name").value.trim(),
    phone:document.getElementById("phone").value.trim(),
    service:document.getElementById("service").value,
    date:document.getElementById("date").value,
    status:"Pending"
  });

  document.getElementById("appointmentMessage").innerHTML=
    "Appointment submitted successfully. Waiting for admin approval.";

  e.target.reset();
}


/* ================= QUEUE ================= */

function syncQueue(){

  appointments.forEach(a=>{

    if(a.status!=="Approved" &&
       a.status!=="Serving")
      return;

    let q=queue.find(x=>x.appointmentId===a.id);

    if(!q){

      queue.push({
        id:"A-"+String(queue.length+1).padStart(3,"0"),
        appointmentId:a.id,
        name:a.name,
        service:a.service,
        status:a.status==="Serving"?"Serving":"Waiting"
      });

    }else{

      q.name=a.name;
      q.service=a.service;

      if(a.status==="Serving")
        q.status="Serving";
    }
  });
}

function renderQueue(){

  syncQueue();

  let serving=queue.find(x=>x.status==="Serving");

  document.getElementById("currentQueue").innerHTML=
    serving
    ? `<h3>Now Serving</h3>
       <h1>${serving.id}</h1>
       <p>${serving.name}</p>
       <small>${serving.service}</small>`
    : `<h3>No patient is currently being served.</h3>`;

  document.getElementById("queueList").innerHTML=
    queue
    .filter(x=>x.status!=="Completed")
    .map(q=>`
      <div class="queue-item">

        <div>
          <div class="queue-number">${q.id}</div>
          <strong>${q.name}</strong>
          <p>${q.service}</p>
        </div>

        <span class="status ${q.status.toLowerCase()}">
          ${q.status}
        </span>

      </div>
    `).join("");
}


/* ================= LOGIN ================= */

function openLogin(){

  document.getElementById("loginModal")
    .style.display="flex";

  document.getElementById("adminUser").focus();
}

function closeLogin(){

  document.getElementById("loginModal")
    .style.display="none";
}

function adminLogin(){

  let user=document.getElementById("adminUser").value;
  let pass=document.getElementById("adminPass").value;

  if(user==="admin" && pass==="1234"){

    closeLogin();

    document.getElementById("adminPanel")
      .classList.add("show");

    adminPage("dashboard");

  }else{

    document.getElementById("loginError").textContent=
      "Invalid username or password.";
  }
}

function logoutAdmin(){

  document.getElementById("adminPanel")
    .classList.remove("show");

  document.getElementById("adminUser").value="";
  document.getElementById("adminPass").value="";
  document.getElementById("loginError").textContent="";
}


/* ================= ADMIN NAVIGATION ================= */

const titles={
  dashboard:"Dashboard",
  appointments:"Appointment Management",
  queueAdmin:"Queue Management",
  patients:"Patient Management",
  inventory:"Inventory Management",
  forecast:"Predictive Restock Forecast",
  reports:"Reports"
};

function adminPage(name){

  document.querySelectorAll(".admin-page")
    .forEach(x=>x.classList.remove("active"));

  document.getElementById(name)
    .classList.add("active");

  document.getElementById("adminTitle")
    .textContent=titles[name];

  if(name==="dashboard")
    renderDashboard();

  if(name==="appointments")
    renderAppointments();

  if(name==="queueAdmin")
    renderAdminQueue();

  if(name==="patients")
    renderPatients();

  if(name==="inventory")
    renderInventory();

  if(name==="forecast")
    renderForecast();
}


/* ================= DASHBOARD ================= */

function renderDashboard(){

  syncQueue();

  document.getElementById("statAppointments")
    .textContent=appointments.length;

  document.getElementById("statQueue")
    .textContent=queue.filter(
      q=>q.status==="Waiting"
    ).length;

  document.getElementById("statInventory")
    .textContent=inventory.length;

  document.getElementById("statAlerts")
    .textContent=countForecastAlerts();
}


/* ================= APPOINTMENT MANAGEMENT ================= */

function renderAppointments(){

  document.getElementById("appointmentTable").innerHTML=`

  <table class="admin-table">

    <tr>
      <th>Patient</th>
      <th>Procedure</th>
      <th>Date</th>
      <th>Status</th>
      <th>Action</th>
    </tr>

    ${appointments.map(a=>`

      <tr>

        <td>${a.name}</td>

        <td>${a.service}</td>

        <td>${a.date}</td>

        <td>${a.status}</td>

        <td>

          ${
            a.status==="Pending"
            ? `<button onclick="approve(${a.id})">
                 Approve
               </button>`
            : a.status
          }

        </td>

      </tr>

    `).join("")}

  </table>`;
}

function approve(id){

  let a=appointments.find(x=>x.id===id);

  if(!a)return;

  a.status="Approved";

  syncQueue();

  renderAppointments();

  renderDashboard();
}


/* ================= QUEUE MANAGEMENT ================= */

function renderAdminQueue(){

  syncQueue();

  document.getElementById("adminQueue").innerHTML=

  `<table class="admin-table">

    <tr>
      <th>Queue No.</th>
      <th>Patient</th>
      <th>Procedure</th>
      <th>Status</th>
      <th>Action</th>
    </tr>

    ${queue.map(q=>`

      <tr>

        <td>${q.id}</td>

        <td>${q.name}</td>

        <td>${q.service}</td>

        <td>${q.status}</td>

        <td>

        ${
          q.status==="Waiting"
          ? `<button onclick="serve('${q.id}')">
               Serve
             </button>`
          : q.status==="Serving"
          ? `<button onclick="complete('${q.id}')">
               Complete
             </button>`
          : "Completed"
        }

        </td>

      </tr>

    `).join("")}

  </table>`;
}

function serve(id){

  queue.forEach(q=>{
    if(q.status==="Serving")
      q.status="Completed";
  });

  let q=queue.find(x=>x.id===id);

  if(!q)return;

  q.status="Serving";

  let a=appointments.find(
    x=>x.id===q.appointmentId
  );

  if(a)
    a.status="Serving";

  renderAdminQueue();
  renderDashboard();
  renderQueue();
}

function complete(id){

  let q=queue.find(x=>x.id===id);

  if(!q)return;

  q.status="Completed";

  let a=appointments.find(
    x=>x.id===q.appointmentId
  );

  if(a){

    a.status="Completed";

    consumeMaterials(a.service);
  }

  renderAdminQueue();
  renderDashboard();
  renderInventory();
}


/* ================= PATIENTS ================= */

function renderPatients(){

  let unique=[];

  appointments.forEach(a=>{

    if(!unique.some(x=>x.name===a.name))
      unique.push(a);

  });

  document.getElementById("patientTable").innerHTML=`

  <table class="admin-table">

    <tr>
      <th>Patient</th>
      <th>Phone</th>
      <th>Last Procedure</th>
      <th>Status</th>
    </tr>

    ${unique.map(p=>`

      <tr>
        <td>${p.name}</td>
        <td>${p.phone}</td>
        <td>${p.service}</td>
        <td>${p.status}</td>
      </tr>

    `).join("")}

  </table>`;
}


/* ================= INVENTORY ================= */

function renderInventory(){

  document.getElementById("inventoryTable").innerHTML=`

  <table class="admin-table">

    <tr>
      <th>Material</th>
      <th>On Hand</th>
      <th>Threshold</th>
      <th>Lead Time</th>
      <th>Supplier</th>
    </tr>

    ${inventory.map(i=>`

      <tr>

        <td>${i.name}</td>

        <td>${i.stock} ${i.unit}</td>

        <td>${i.threshold}</td>

        <td>${i.lead} days</td>

        <td>${i.supplier}</td>

      </tr>

    `).join("")}

  </table>`;
}


/* ================= PREDICTIVE FORECAST ================= */

/*
  The forecast uses:

  Scheduled appointments
  + Procedure BOM
  + Current inventory
  + Supplier lead time
  + Safety threshold
*/

function calculateForecast(days){

  let end=dateLimit(days);

  let upcoming=appointments.filter(a=>{

    if(a.status==="Completed")
      return false;

    let d=new Date(a.date);

    return d>=new Date() && d<=end;
  });

  return inventory.map(item=>{

    let demand=0;

    upcoming.forEach(a=>{

      let materials=BOM[a.service];

      if(materials && materials[item.name])
        demand+=materials[item.name];
    });

    let projected=item.stock-demand;

    let reorder=0;

    if(projected<item.threshold){

      reorder=
        Math.max(
          item.threshold-projected,
          demand
        );
    }

    return{
      ...item,
      demand,
      projected,
      reorder
    };
  });
}

function renderForecast(){

  let days=parseInt(
    document.getElementById("forecastDays").value
  );

  let results=calculateForecast(days);

  document.getElementById("forecastResults").innerHTML=

  results.map(r=>{

    let danger=r.projected<0;
    let warning=r.projected<r.threshold;

    let cls=danger
      ? "danger"
      : warning
      ? "warning"
      : "";

    return`

      <div class="forecast-card ${cls}">

        <h4>${r.name}</h4>

        <div class="forecast-grid">

          <div>
            <small>Current Stock</small>
            <strong>${r.stock}</strong>
          </div>

          <div>
            <small>Projected Usage</small>
            <strong>${r.demand}</strong>
          </div>

          <div>
            <small>Projected Stock</small>
            <strong>${r.projected}</strong>
          </div>

          <div>
            <small>Lead Time</small>
            <strong>${r.lead} days</strong>
          </div>

        </div>

        ${
          danger
          ? `
          <div class="reorder">

            <strong>
              ⚠ Insufficient supplies for future demand.
            </strong>

            <p>
              Scheduled procedures may exhaust
              ${r.name} before the next delivery.
            </p>

            <button onclick="reorder('${r.name}',${r.reorder})">
              Generate Reorder Request
            </button>

          </div>
          `
          : warning
          ? `
          <div class="reorder">

            <strong>
              ⚠ Restock recommended.
            </strong>

            <p>
              Projected inventory will fall below
              the safety threshold.
            </p>

            <button onclick="reorder('${r.name}',${r.reorder})">
              Generate Reorder Request
            </button>

          </div>
          `
          : `
          <div class="reorder"
               style="background:#d4edda;color:#155724">

            ✓ Inventory is sufficient for
            projected demand.

          </div>
          `
        }

      </div>

    `;

  }).join("");
}


/* ================= REORDER ================= */

function reorder(name,quantity){

  let item=inventory.find(x=>x.name===name);

  if(!item)return;

  alert(
    "REORDER REQUEST GENERATED\n\n"+
    "Material: "+name+"\n"+
    "Quantity: "+quantity+" "+item.unit+"\n"+
    "Supplier: "+item.supplier+"\n"+
    "Lead Time: "+item.lead+" days"
  );
}


/* ================= INTEGRITY LOOP ================= */

/*
  When a procedure is completed,
  its BOM materials are automatically deducted.
*/

function consumeMaterials(service){

  let materials=BOM[service];

  if(!materials)return;

  Object.keys(materials).forEach(name=>{

    let item=inventory.find(
      x=>x.name===name
    );

    if(item)
      item.stock-=materials[name];

  });
}


/*
  Manual adjustment for unexpected consumption.
*/

function quickAdjust(name,amount){

  let item=inventory.find(
    x=>x.name===name
  );

  if(!item)return;

  item.stock+=amount;

  renderInventory();
  renderForecast();
}


/* ================= ALERT COUNT ================= */

function countForecastAlerts(){

  return calculateForecast(30)
    .filter(x=>x.projected<x.threshold)
    .length;
}


/* ================= START ================= */

document.getElementById("year").textContent=
  new Date().getFullYear();

document.getElementById("date").min=
  new Date().toISOString().split("T")[0];

syncQueue();