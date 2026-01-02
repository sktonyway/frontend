const vehicleInput = document.getElementById('vehicle-input'); //From input box
const ul = document.getElementById('vehicleList');  // It access the vehicle element
const backend = "https://fuel-testing-api.vercel.app" // Backend link
const res = await fetch(`${backend}/api/vehicles`)
const ervsDb = await res.json()
let selectedERV = null;

//logics for adding entry in form
const prevOdo = document.getElementById('prevOdo');
const currOdo = document.getElementById('currOdo');
const totalKm = document.getElementById('totalKm');
const vol = document.getElementById('vol');
const rate = document.getElementById('rate');
const totalAmt = document.getElementById('totalAmt');
const kmpl = document.getElementById('kmpl');
const user = document.getElementById('user');


// 🔍 Search logic
vehicleInput.addEventListener("input", () => {
  const value = vehicleInput.value.toLowerCase();

  ul.innerHTML = "";
  if (!value) {
    return;
  }
  const filtered = ervsDb.filter(v =>
    v.toLowerCase().includes(value)
  );
  filtered.forEach(v => {
    const li = document.createElement('li');
    li.textContent = v;
    li.className = 'vehicle';

    li.addEventListener('click', () => openVehicle(v))
    ul.appendChild(li);
  })
});

// It updates dom element and fetches txns data add button and cancel add button.
async function openVehicle(erv) {
  selectedERV = erv;
  const res = await fetch(`${backend}/api/txn/${erv}`);
  const txns = await res.json();
  document.getElementById('addEntryForm').style.display = "none";

  resetEntryForm();


  // set previous odometer from latest transaction
  if (txns.length > 0) {
    prevOdo.value = txns[0].currOdo;   // 👈 key logic
  } else {
    prevOdo.value = 0;                // first entry for vehicle
  }

  // Function for Total Km
  function calculateTotalKm() {
    const prev = Number(prevOdo.value);
    const curr = Number(currOdo.value);

    if (!isNaN(prev) && !isNaN(curr) && curr >= prev) {
      totalKm.value = curr - prev;
    } else {
      totalKm.value = "";
    }
  }
  currOdo.addEventListener("input", calculateTotalKm);

  // Function for Amount 
  function calculateAmount() {
    const v = Number(vol.value);
    const r = Number(rate.value);

    if (!isNaN(v) && !isNaN(r)) {
      totalAmt.value = (v * r).toFixed(2);
    } else {
      alert('Check Vol. and rate.')
    }
  }
  // For KMPL
  function calculateKmpl() {
    const km = Number(totalKm.value);
    const v = Number(vol.value);

    if (!isNaN(km) && !isNaN(v) && v > 0) {
      kmpl.value = (km / v).toFixed(2);
    } else {
      kmpl.value = "";
    }
  }

  vol.addEventListener("input", calculateKmpl);
  rate.addEventListener("input", calculateAmount);



  const tbody = document.querySelector("#txnTable tbody");
  tbody.innerHTML = "";

  txns.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(t.date).toLocaleDateString()}</td>
      <td>${t.vol}</td>
      <td>${t.rate}</td>
      <td>${t.amt}</td>
      <td>${t.user}</td>
      <td>${t.prevOdo}</td>
      <td>${t.currOdo}</td>
      <td>${t.totalKm}</td>
      <td>${t.kmpl}</td>
      <td>${t.remarks}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('vehicleTitle').textContent = erv;
  document.getElementById('addEntryBtn').style.display = "inline-block";

}

document.getElementById("addEntryBtn").addEventListener("click", () => {
  document.getElementById("addEntryForm").style.display = "block";
  document.getElementById('addEntryBtn').style.display = "none";


});
document.getElementById("cancelAdd").addEventListener("click", () => {
  document.getElementById("addEntryForm").style.display = "none";
});






// It should fill form data.
document.getElementById("addEntryForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedERV) return alert("Select a vehicle first");  // It will not happen because form is hidden until vehicle is selected.

  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  console.log(data);

  // attach ERV
  data.erv = selectedERV;

  const res = await fetch(`${backend}/api/submitTxn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    alert("Failed to save");
    return;
  }

  form.reset();
  form.style.display = "none";

  // ✅ reset & hide form
  resetEntryForm();


  // refresh table
  openVehicle(selectedERV);
});


function resetEntryForm() {
  const form = document.getElementById("addEntryForm");
  form.reset();
  form.style.display = "none";

  // also reset calculated fields explicitly (safe)
  document.getElementById("totalKm").value = "";
  document.getElementById("totalAmt").value = "";
  document.getElementById("kmpl").value = "";
}
