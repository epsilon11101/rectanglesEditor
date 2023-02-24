import "./styles";
import Rectangle from "./rectangle";
import Notiflix from "notiflix";
import axios from "axios";
import "../html/instructions.html";
const selector = document.createElement("input");
const $btn_menu = document.querySelector(".sub-menu");
const $json_title = document.querySelector(".name p:first-child");
const $img_title = document.querySelector(".name p:last-child");
const $color_selector = document.querySelector(".color_selector");
const $canva = document.querySelector("canvas");
const ctx = $canva.getContext("2d");
const img = new Image();

let rectColor = "#FF0000";
let selectedColor = "#00FF00";

let isDrawing = false;
let isEditingWH = false;
let isEditingXY = false;
let ismouseMoveDown = false;

let startX, startY, endX, endY;
let currentRectIndex = -1;
let increment_name = 1;

const rectangles = [];
const rectangles_copy = [];

selector.type = "file";

Notiflix.Notify.init({
  closeButton: true,
  clickToClose: true,
  showOnlyTheLastOne: true,
});

$color_selector.addEventListener("change", (e) => {
  rectColor = `#${$color_selector.color}`;
  $canva.style.borderColor = `${rectColor}`;
});

document.addEventListener("keydown", (event) => {
  event.preventDefault();
  const { ctrlKey, code, key, shiftKey } = event;

  if (ctrlKey && key === "r") {
    Notiflix.Notify.info("REMOVE RECTANGLE  ENABLED");
    handleDeleteRectangle();
  } else if (ctrlKey && shiftKey && (code === "KeyE" || key === "e")) {
    Notiflix.Notify.info("EDIT (x,y)  ENABLED");
    handleEditRectangleXY();
  } else if (ctrlKey && key === "e") {
    Notiflix.Notify.info("EDIT (w,h)  ENABLED");
    handleEditRectangleWH();
  } else if (ctrlKey && key === "d") {
    Notiflix.Notify.info("DRAWING RECTANGLE  ENABLED");
    handleDrawRectangle();
  } else if (ctrlKey && key === "z") {
    handleRestoreRectangle();
  }
});

$canva.addEventListener("click", (e) => {
  let obj_cor = getMousePos(e);
  let clickX = obj_cor.x;
  let clickY = obj_cor.y;

  for (const key_r in rectangles) {
    const rectangle = rectangles[key_r].properties;
    const { xmin, ymin, width, height, key } = rectangle;
    const rect = new Path2D();
    rect.rect(xmin, ymin, width, height);

    if (ctx.isPointInStroke(rect, clickX, clickY)) {
      Notiflix.Notify.info(`Rectangle ${key} selected`);
      currentRectIndex = key_r;
      const first_color = rectangles[currentRectIndex].properties.color;
      rectangles[currentRectIndex].properties.color =
        rectangles[currentRectIndex].properties.selected_color;
      drawRectangles();
      rectangles[currentRectIndex].properties.color = first_color;
      return;
    } else {
      currentRectIndex = -1;
      drawRectangles();
    }
  }
});

$canva.addEventListener("dblclick", (e) => {
  restoreDrawingFLags();
});

$canva.addEventListener("mousedown", (e) => {
  if (isDrawing && !ismouseMoveDown) {
    ismouseMoveDown = true;
    console.log("dibujando");
    let obj_cor = getMousePos(e);
    startX = obj_cor.x;
    startY = obj_cor.y;
  }
});
$canva.addEventListener("mousemove", (e) => {
  let obj_cor = getMousePos(e);
  if (isDrawing && ismouseMoveDown) {
    isUserDrawing(obj_cor);
  } else if (isEditingWH && !isEditingXY) {
    isUserEditWH(obj_cor);
  } else if (!isEditingWH && isEditingXY) {
    isUserEditXY(obj_cor);
  }
});

$canva.addEventListener("mouseup", (e) => {
  if (isDrawing) {
    console.log(isDrawing, "dibujando", currentRectIndex);
    rectangles.push(
      new Rectangle({
        key: "drawed_div_" + increment_name++,
        xmin: startX,
        ymin: startY,
        xmax: endX,
        ymax: endY,
        width: endX - startX,
        height: endY - startY,
        tag: "div",
        label: "div",
        color: rectColor,
        selected_color: selectedColor,
      })
    );
    currentRectIndex = -1;
    ismouseMoveDown = false;
  }

  restoreDrawingFLags();
});

$btn_menu.addEventListener("click", async (e) => {
  const targetValue = e.target.value;
  switch (true) {
    case targetValue.includes("img"):
      handleOpenImage(selector);
      break;
    case targetValue.includes("json"):
      handleOpenJSON(selector);
      break;
    case targetValue.includes("color"):
      handleOpenColorSelector($color_selector);
      break;
    case targetValue.includes("help"):
      handleOpenInstructions();
      break;
    case targetValue.includes("save"):
      handleSaveJSON(rectangles);
      break;
    default:
      break;
  }
});

selector.addEventListener("change", async () => {
  const openImgBtn = document.querySelector("button[value='img']");
  const saveJsonBtn = document.querySelector("button[value='save']");
  const fileDataUrl = await selectFile(selector);

  try {
    if (selector.accept.includes("image")) {
      handleImageFile(fileDataUrl, openImgBtn);
    } else {
      handleJsonFile(fileDataUrl, openImgBtn, saveJsonBtn);
    }
  } catch (error) {
    Notiflix.Notify.failure(error);
  }
});

const getMousePos = (evt) => {
  const rect = $canva.getBoundingClientRect();
  return {
    x: Math.abs(
      ((evt.clientX - rect.left) / (rect.right - rect.left)) * $canva.width
    ),
    y: Math.abs(
      ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * $canva.height
    ),
  };
};

function drawRectangles() {
  ctx.drawImage(img, 0, 0);
  for (const key in rectangles) {
    const rectangle = rectangles[key].properties;
    const { xmin, ymin, width, height, color } = rectangle;
    ctx.lineWidth = 10;
    ctx.strokeStyle = color;
    ctx.strokeRect(xmin, ymin, width, height);
  }
}
function restoreDrawingFLags() {
  isEditingWH = false;
  isEditingXY = false;
  isDrawing = false;
  currentRectIndex = -1;
}
function handleRestoreRectangle() {
  restoreDrawingFLags();
  if (rectangles_copy.length > 0) {
    const { key } = rectangles_copy[0].properties;
    rectangles.push(rectangles_copy[0]);
    rectangles_copy.length = 0;
    Notiflix.Notify.success(`Restore ${key} rectangle`);
    drawRectangles();
  } else {
    Notiflix.Notify.failure("No items to restore");
  }
}
function handleDeleteRectangle() {
  const key = rectangles[currentRectIndex].properties.key;
  rectangles_copy.push(rectangles[currentRectIndex]);
  delete rectangles[currentRectIndex];
  restoreDrawingFLags();
  Notiflix.Notify.warning(`Remove ${key} rectangle`);
  drawRectangles();
}

function handleEditRectangleXY() {
  isEditingWH = false;
  isEditingXY = true;
  isDrawing = false;
}

function handleEditRectangleWH() {
  isEditingWH = true;
  isEditingXY = false;
  isDrawing = false;
}

function handleDrawRectangle() {
  isEditingWH = false;
  isEditingXY = false;
  isDrawing = true;
}

function isUserDrawing(obj_cor) {
  endX = obj_cor.x;
  endY = obj_cor.y;
  drawRectangles();
  ctx.strokeStyle = rectColor;
  ctx.strokeRect(startX, startY, endX - startX, endY - startY);
}
function isUserEditWH(obj_cor) {
  if (currentRectIndex != -1) {
    let newWidth = obj_cor.x - rectangles[currentRectIndex].properties.xmin;
    let newHeight = obj_cor.y - rectangles[currentRectIndex].properties.ymin;

    rectangles[currentRectIndex].properties.width = newWidth;
    rectangles[currentRectIndex].properties.height = newHeight;
    rectangles[currentRectIndex].properties.color = rectColor;

    drawRectangles();
  }
}
function isUserEditXY(obj_cor) {
  if (currentRectIndex != -1) {
    let rectangle = rectangles[currentRectIndex].properties;
    let centerX = obj_cor.x - rectangle.width / 2;
    let centerY = obj_cor.y - rectangle.height / 2;
    rectangle.xmin = centerX;
    rectangle.ymin = centerY;
    rectangle.color = rectColor;
    drawRectangles();
  }
}

function handleOpenColorSelector(colorSelector) {
  colorSelector.classList.toggle("hide");
}

function handleSaveJSON(rectangles) {
  const saveJSON = {};
  rectangles.forEach((rectangle) => {
    const elementKey = rectangle.properties.key;
    saveJSON[elementKey] = rectangle.properties;
  });
  const objectJSON = JSON.stringify(saveJSON);
  const blob = new Blob([objectJSON], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data.json";
  link.click();
}

function generateName(rectangles) {
  let lastRectangle = -1;

  const isNew = rectangles.some((rectangle) =>
    rectangle.properties.key.includes("drawed_div")
  );

  increment_name = isNew
    ? Math.max(
        ...rectangles
          .filter((rectangle) =>
            rectangle.properties.key.includes("drawed_div")
          )
          .map((rectangle) => parseInt(rectangle.properties.key.split("_")[2]))
      ) + 1
    : 1;
}

async function selectFile(selector) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(selector.files[0]);
  });
}

async function handleOpenImage(selector) {
  selector.accept = "";
  selector.accept = "image/*";
  selector.click();
}

async function handleOpenJSON(selector) {
  selector.accept = "";
  selector.accept = ".json";
  selector.click();
}
async function handleOpenInstructions() {
  try {
    const modalCode = await axios.get("src/html/instructions.html");
    const $modal = document.querySelector(".instructions");
    $modal.innerHTML = modalCode.data;
    $modal.style.display = "flex";
    const $modalBtn = document.querySelector(".modal span");
    $modalBtn.addEventListener("click", (e) => {
      $modal.style.display = "none";
    });
  } catch (error) {
    console.error(error);
  }
}
async function handleImageFile(fileDataUrl, openImgBtn) {
  $img_title.innerText = `Image file: ${selector.files[0].name}`;
  img.src = await fileDataUrl;
  openImgBtn.classList.toggle("disabled");

  img.onload = () => {
    $canva.width = img.width;
    $canva.height = img.height;
    ctx.drawImage(img, 0, 0);
    drawRectangles();
  };
}

async function handleJsonFile(fileDataUrl, openImgBtn, saveJsonBtn) {
  ctx.clearRect(0, 0, $canva.width, $canva.height);
  $json_title.innerText = `Json file: ${selector.files[0].name}`;
  const jsonRectangles = await axios.get(fileDataUrl);

  try {
    handleJsonData(jsonRectangles, openImgBtn, saveJsonBtn);
  } catch (error) {
    Notiflix.Notify.failure("error loading JSON file");
  }
}

async function handleJsonData(jsonRectangles, openImgBtn, saveJsonBtn) {
  let color = rectColor;
  let selected_color = selectedColor;

  rectangles.length = 0;

  const data = await jsonRectangles.data;
  for (const keyElem in data) {
    const { xmax, ymax, xmin, ymin, width, height, key, tag, label } =
      data[keyElem];
    if ("color" in data[keyElem]) color = data[keyElem].color;
    if ("selected_color" in data[keyElem])
      selected_color = data[keyElem].selected_color;

    const rectangle = new Rectangle({
      key,
      xmin,
      ymin,
      xmax,
      ymax,
      width,
      height,
      tag,
      label,
      color,
      selected_color,
    });
    rectangles.push(rectangle);
  }
  generateName(rectangles);
  openImgBtn.classList.toggle("disabled");
  saveJsonBtn.classList.toggle("disabled");
}
