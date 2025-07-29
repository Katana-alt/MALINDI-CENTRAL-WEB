const subjectsAll = [
  "English", "Kiswahili", "Mathematics", "Science",
  "Agrinutrition", "Social Studies", "Religious Education", 
  "Pre-technical Studies", "Creative Arts", "Environmental"
];

const grading = score => score >= 80 ? "EE" : score >= 60 ? "ME" : score >= 40 ? "AE" : "BE";

const gradeEl = document.getElementById("grade");
const streamEl = document.getElementById("stream");
const subjectsEl = document.getElementById("subjects");
const tableHeaders = document.getElementById("table-headers");
const studentsEl = document.getElementById("students");
const filterGradeEl = document.getElementById("filter-grade");
const filterStreamEl = document.getElementById("filter-stream");

const gradeOptions = Array.from({ length: 9 }, (_, i) => i + 1);
const streamsMap = { 
  lower: ["KENYA", "TANZAI", "G"], 
  upper: ["B", "R", "G", "W"] 
};

let editId = null;

gradeOptions.forEach(g => {
  let opt = document.createElement("option");
  opt.value = g;
  opt.textContent = `Grade ${g}`;
  gradeEl.appendChild(opt);
  filterGradeEl.appendChild(opt.cloneNode(true));
});

gradeEl.addEventListener("change", updateSubjects);
filterGradeEl.addEventListener("change", displayLearners);
filterStreamEl.addEventListener("change", displayLearners);

function updateSubjects() {
  streamEl.innerHTML = "";
  const grade = parseInt(gradeEl.value);
  const streams = grade <= 6 ? streamsMap.lower : streamsMap.upper;
  streams.forEach(s => {
    let opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    streamEl.appendChild(opt);
  });

  subjectsEl.innerHTML = "";
  let activeSubjects = [];
  if (grade >= 1 && grade <= 3) {
    activeSubjects = ["English", "Mathematics", "Kiswahili", "Environmental", "Creative Arts"];
  } else if (grade >= 4 && grade <= 6) {
    activeSubjects = ["English", "Mathematics", "Kiswahili", "Science", "Creative Arts", "Agrinutrition", "Social Studies", "Religious Education"];
  } else if (grade >= 7 && grade <= 9) {
    activeSubjects = ["English", "Mathematics", "Kiswahili", "Science", "Social Studies", "Religious Education", "Pre-technical Studies", "Creative Arts", "Agrinutrition"];
  }

  activeSubjects.forEach(sub => {
    const label = document.createElement("label");
    label.innerHTML = `${sub}: <input type="number" name="${sub}" min="0" max="100" required>`;
    subjectsEl.appendChild(label);
  });
}

document.getElementById("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const grade = gradeEl.value;
  const stream = streamEl.value;
  const inputs = subjectsEl.querySelectorAll("input");
  const scores = {};
  inputs.forEach(i => scores[i.name] = parseInt(i.value));
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const average = Math.round(total / Object.keys(scores).length);

  let list = JSON.parse(localStorage.getItem("learners") || "[]");

  if (editId) {
    list = list.map(l => l.id === editId ? { ...l, name, grade, stream, scores, total, average } : l);
    editId = null;
  } else {
    const id = Date.now();
    list.push({ id, name, grade, stream, scores, total, average });
  }

  localStorage.setItem("learners", JSON.stringify(list));
  form.reset();
  subjectsEl.innerHTML = "";
  displayLearners();
});

function displayLearners() {
  let list = getFilteredLearners();
  const headers = ["#", "Name", "Grade", "Stream", ...subjectsAll.map(s => `${s} (Mark/Grade)`), "Total", "Average", "Rank", "Actions"];
  tableHeaders.innerHTML = headers.map(h => `<th>${h}</th>`).join("");
  studentsEl.innerHTML = "";

  let subjectAverages = new Array(subjectsAll.length).fill(0);
  let gradeCounts = { EE: 0, ME: 0, AE: 0, BE: 0 };

  list.forEach((l, i) => {
    const subCols = subjectsAll.map((s, idx) => {
      const mark = l.scores[s] ?? "-";
      const grade = mark !== "-" ? grading(mark) : "-";
      if (mark !== "-") {
        gradeCounts[grade]++;
        subjectAverages[idx] += mark;
      }
      return `<td>${mark !== "-" ? `${mark} (${grade})` : "-"}</td>`;
    });

    studentsEl.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${l.name}</td>
        <td>${l.grade}</td>
        <td>${l.stream}</td>
        ${subCols.join("")}
        <td>${l.total}</td>
        <td>${l.average} (${grading(l.average)})</td>
        <td>${l.rank}</td>
        <td>
          <button onclick="editLearner(${l.id})">Edit</button>
          <button onclick="deleteLearner(${l.id})">Delete</button>
        </td>
      </tr>`;
  });

  const subjectAverageRow = subjectAverages.map(avg => (avg / list.length).toFixed(2));
  document.getElementById("average-row").innerHTML = `
    <tr><td colspan="4">Averages</td>${subjectAverageRow.map(avg => `<td>${avg}</td>`).join("")}<td colspan="3"></td></tr>
    <tr><td colspan="4">Summary</td><td>EE: ${gradeCounts.EE}</td><td>ME: ${gradeCounts.ME}</td><td>AE: ${gradeCounts.AE}</td><td>BE: ${gradeCounts.BE}</td><td colspan="2"></td></tr>`;
}

function editLearner(id) {
  const list = JSON.parse(localStorage.getItem("learners") || "[]");
  const l = list.find(l => l.id === id);
  if (!l) return;
  editId = id;
  document.getElementById("name").value = l.name;
  gradeEl.value = l.grade;
  updateSubjects();
  streamEl.value = l.stream;
  setTimeout(() => {
    for (let s in l.scores) {
      const input = subjectsEl.querySelector(`input[name="${s}"]`);
      if (input) input.value = l.scores[s];
    }
  }, 100);
}

function deleteLearner(id) {
  if (!confirm("Are you sure?")) return;
  let list = JSON.parse(localStorage.getItem("learners") || "[]");
  list = list.filter(l => l.id !== id);
  localStorage.setItem("learners", JSON.stringify(list));
  displayLearners();
}

function getFilteredLearners() {
  let list = JSON.parse(localStorage.getItem("learners") || "[]");
  const g = filterGradeEl.value, s = filterStreamEl.value;
  list = list.filter(l => (!g || l.grade == g) && (!s || l.stream == s));
  list.sort((a, b) => b.average - a.average);
  list.forEach((l, i) => l.rank = i + 1);
  return list;
}

function getExportTitle() {
  const g = filterGradeEl.value, s = filterStreamEl.value;
  return `Grade ${g || 'All'} Stream ${s || 'All'} - Term 2, 2025`;
}

document.getElementById("export-excel").addEventListener("click", exportToExcel);

function exportToExcel() {
  const list = getFilteredLearners();
  const wb = XLSX.utils.book_new();
  const wsData = [];

  const header = ["#", "Name", "Grade", "Stream", ...subjectsAll.map(s => `${s} (Mark/Grade)`), "Total", "Average", "Rank"];
  wsData.push([getExportTitle()]);
  wsData.push(header);

  list.forEach((l, i) => {
    const row = [
      i + 1, l.name, l.grade, l.stream,
      ...subjectsAll.map(s => {
        const mark = l.scores[s];
        return mark !== undefined ? `${mark} (${grading(mark)})` : "-";
      }),
      l.total,
      `${l.average} (${grading(l.average)})`,
      l.rank
    ];
    wsData.push(row);
  });

  // Subject averages
  const subjectSums = new Array(subjectsAll.length).fill(0);
  const counts = { EE: 0, ME: 0, AE: 0, BE: 0 };

  list.forEach(l => {
    subjectsAll.forEach((s, idx) => {
      const mark = l.scores[s];
      if (mark !== undefined) {
        subjectSums[idx] += mark;
        counts[grading(mark)]++;
      }
    });
  });

  const subjectAvgs = subjectSums.map(s => (s / list.length).toFixed(2));

  wsData.push(["", "Averages", "", "", ...subjectAvgs, "", "", ""]);
  wsData.push(["", "Summary", "", "", `EE: ${counts.EE}`, `ME: ${counts.ME}`, `AE: ${counts.AE}`, `BE: ${counts.BE}`, "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Learners");
  XLSX.writeFile(wb, `${getExportTitle().replace(/ /g, "_")}.xlsx`);
}

// PRELOAD LEARNERS NAMES IF NONE EXISTS
(function preloadLearners() {
  if (localStorage.getItem("learners")) return;

  const names = [
    "Alex Gowe","Amani Munga","Amani Nicholus","Betty Kenga","Constance Mbodze",
    "Damaris Meja","Daniel Mkare","Dennis Yaa","Elkana Kiti","Elvina Safari",
    "Esha Luvuno","Faith Amina","Faith Karisa","Fenny Anzazi","Gladys Tatu",
    "Hassan Gilbert","Ibrahim Amani","James Rama","Janice Laura","Joan Pendo",
    "Joseph Clinton","Joseph Karisa","Karembo Karisa","Kelvin Katana","Kelvin Samson",
    "Latifa Kanze","Laurine Dama","Lavenda Nekesa","Lavenda Safari","Leloy Siron",
    "Lucky Baraka","Lucy Dhahabu","Luiza Kingi","Lukuman Tunje","Marco Ruwa",
    "Margaret Furaha","Markson Tsori","Marylina William","Maureen Mahenzo","Merylina Benson",
    "Michael Baya","Millicent Kadzo","Morris Mwambire","Nelly Kadzo","Nelly Mahenzo",
    "Pauline Zawadi","Pendo Bidii Diyo","Purity Syekonyo","Reymond Masha","Samuel Kazungu",
    "Shadrack Kazungu","Sharlet Charo","Sharon Imani","Shukran Rashid","Sifa Clement",
    "Stella Festus","Steve Kombe","Unda Charo Alfred","Vema Kwekwe","Wilson Mwaponda",
    "Yvonne Simon","Zacharia Njuguna"
  ];

  const learners = names.map(name => ({
    id: Date.now() + Math.random(),
    name,
    grade: "1",
    stream: "B",
    scores: {},
    total: 0,
    average: 0,
    rank: 0,
  }));

  localStorage.setItem("learners", JSON.stringify(learners));
})();

// INITIALIZE
updateSubjects();
displayLearners();
