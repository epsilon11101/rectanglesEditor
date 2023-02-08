//TODO: AGREGAR MODAL PARA MOSTRAR INSTRUCCIONES OCULTAR EL COLOR CAMBIAR NOMBRE DE BOTONES

import "../styles/root.css";
import "../styles/header.css";
import "../styles/nav.css";
import "../styles/main.css";
import "../styles/canvas.css";
import Rectangle from "./rectangle";
import "@spectrum-web-components/color-wheel/sp-color-wheel.js";

import Notiflix from "notiflix";
import axios from "axios";

const doc = document;

const selector = document.createElement("input");
const json_selector = document.createElement("input");
const $btn_menu = document.querySelector(".sub-menu");
const $json_title = document.querySelector(".name p:first-child");
const $img_title = document.querySelector(".name p:last-child");
const $color_selector = document.querySelector(".color_selector");
const $canva = document.querySelector("canvas");
const ctx = $canva.getContext("2d");
const img = new Image();

let rectColor = "#FF0000";
let isDrawing = false;
let isEditingWH = false;
let isEditingXY = false;
let startX, startY, endX, endY;
let currentRectIndex = -1;

let rectangles = [];

selector.type = "file";

$color_selector.addEventListener("change", (e) => {
  rectColor = `#${$color_selector.color}`;
});

function drawRectangles() {
  ctx.drawImage(img, 0, 0);
  for (const key in rectangles) {
    const rectangle = rectangles[key].properties;
    const { xmin, ymin, width, height, color } = rectangle;
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.strokeRect(xmin, ymin, width, height);
  }
}

document.addEventListener("keydown", function (e) {
  e.preventDefault();
  //remove rectangle
  if (e.ctrlKey && e.key === "d") {
    delete rectangles[currentRectIndex];
    isEditingWH = false;
    isEditingXY = false;
    drawRectangles();
  } else if (e.ctrlKey && e.shiftKey && (e.code === "KeyE" || e.key === "e")) {
    isEditingWH = false;
    isEditingXY = true;
    console.log(isEditingWH, isEditingXY);
  } else if (e.ctrlKey && e.key == "e") {
    isEditingWH = true;
    isEditingXY = false;
  }
});
$canva.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    let obj_cor = getMousePos(e);
    endX = obj_cor.x;
    endY = obj_cor.y;
    ctx.clearRect(0, 0, $canva.width, $canva.height);
    ctx.drawImage(img, 0, 0);

    rectangles.forEach((rect) => {
      ctx.strokeStyle = rect.color;
      ctx.strokeRect(rect.startX, rect.startY, rect.width, rect.height);
    });
    ctx.strokeStyle = rectColor;
    ctx.lineWidth = 5;
    ctx.strokeRect(startX, startY, endX - startX, endY - startY);
  } else if (isEditingWH && !isEditingXY) {
    let obj_cor = getMousePos(e);
    let newWidth = obj_cor.x - rectangles[currentRectIndex].properties.xmin;
    let newHeight = obj_cor.y - rectangles[currentRectIndex].properties.ymin;

    rectangles[currentRectIndex].properties.width = newWidth;
    rectangles[currentRectIndex].properties.height = newHeight;
    rectangles[currentRectIndex].properties.color = rectColor;

    drawRectangles();
  } else if (!isEditingWH && isEditingXY) {
    let obj_cor = getMousePos(e);
    rectangles[currentRectIndex].properties.xmin = obj_cor.x;
    rectangles[currentRectIndex].properties.ymin = obj_cor.y;
    rectangles[currentRectIndex].properties.color = rectColor;
    console.log(
      rectangles[currentRectIndex].properties.xmin,
      rectangles[currentRectIndex].properties.ymin
    );
    drawRectangles();
  }
});
$canva.addEventListener("click", (e) => {
  let obj_cor = getMousePos(e);
  let clickX = obj_cor.x;
  let clickY = obj_cor.y;

  for (const key in rectangles) {
    const rectangle = rectangles[key].properties;
    const { xmin, ymin, width, height } = rectangle;
    if (
      clickX >= xmin &&
      clickX <= xmin + width &&
      clickY >= ymin &&
      clickY <= ymin + height
    ) {
      currentRectIndex = key;
      return;
    }
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

$canva.addEventListener("dblclick", (e) => {
  isEditingWH = false;
  isEditingXY = false;
});

$canva.addEventListener("mousedown", (e) => {
  // if (!isEditingWH) isDrawing = true;
  let obj_cor = getMousePos(e);
  startX = obj_cor.x;
  startY = obj_cor.y;
  ctx.lineWidth = 5;
});

$canva.addEventListener("mouseup", (e) => {
  const color = rectColor;
  isDrawing = false;
  isEditingWH = false;

  // rectangles.push(
  //   new Rectangle({
  //     startX,
  //     startY,
  //     width: endX - startX,
  //     height: endY - startY,
  //     color,
  //   })
  // );
});

selector.addEventListener("change", async () => {
  try {
    const dataUrl = await selectFile(selector);
    if (selector.accept.includes("image")) {
      $img_title.innerText = `Image file: ${selector.files[0].name}`;
      img.src = await dataUrl;
      img.onload = () => {
        $canva.width = img.width;
        $canva.height = img.height;
        // rectangles.length = 0;
        ctx.drawImage(img, 0, 0);
        drawRectangles();
      };
    } else {
      const json_rectangles = await axios.get(dataUrl);
      const color = rectColor;
      try {
        const data = await json_rectangles.data;
        for (const key in data) {
          const { xmin, ymin, width, height } = data[key];
          const rectangle = new Rectangle({
            xmin,
            ymin,
            width,
            height,
            color,
            key,
          });
          rectangles.push(rectangle);
        }
      } catch (error) {
        Notiflix.Notify.failure("error loading JSON file");
      }
    }
  } catch (error) {
    Notiflix.Notify.failure(error);
  }
});

async function selectFile(selector) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(selector.files[0]);
  });
}

$btn_menu.addEventListener("click", async (e) => {
  if (e.target.value.includes("img")) {
    selector.accept = "";
    selector.accept = "image/*";
    selector.click();
  } else if (e.target.value.includes("json")) {
    selector.accept = "";
    selector.accept = ".json";
    selector.click();
  } else if (e.target.value.includes("color")) {
    e.target.classList.remove(".hide");
    $color_selector.classList.remove("hide");
  } else if (e.target.value.includes("edit")) {
  }
});
