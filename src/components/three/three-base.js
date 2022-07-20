import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export default class ThreeBase {
  constructor(el, options) {
    this.dom = el; // 插入的dom
    // 配置参数
    this.opt = {
      sceneUrl: "", // 场景url
      modelUrl: "", // 模型url
      autoRotate: false, // 是否自动旋转
      isFullBrowser: true, // 生成的canvas是否铺满浏览器
      ...options,
    };
    this.scene = null; // 场景
    this.camera = null; // 摄像机
    this.renderer = null; // 渲染器
    this.controls = null; // 控制器
    this.model = null; // 模型
    this.pointLight = null; // 自动追随光
    this.init();
  }
  // 初始化
  init () {
    this.sceneInit();
    this.cameraInit();
    this.renderInit();
    this.controlsInit();
    this.animate();
    // 加载背景图片
    if (this.opt.sceneBg) {
      this.scene.background = new THREE.TextureLoader().load(this.opt.sceneBg);
    }
    // 加载场景
    if (this.opt.sceneUrl) {
      this.loadScene(this.opt.sceneUrl);
    }
    // 加载模型
    if (this.opt.modelUrl) {
      this.loadModel(this.opt.modelUrl);
      // 点光源
      this.pointLight = new THREE.PointLight(0xffffff, .8);
      this.pointLight.position.set(0, 0, 100);
      this.scene.add(this.pointLight);
    }
    // 响应窗口大小改变
    if (this.opt.isFullBrowser) {
      window.addEventListener("resize", this.onWindowResize.bind(this));
    }
  }
  // 场景初始化
  sceneInit () {
    this.scene = new THREE.Scene();

    const point = new THREE.PointLight(0xffffff, .8);
    point.position.set(20, 32, -20);
    this.pointLight = point;
    this.scene.add(this.pointLight);
    // 环境光
    // let ambient = new THREE.AmbientLight(0xffffff);
    // this.scene.add(ambient);

    this.opt.lights.map((item) => {
      item.obj.name = item.name;
      item.position && item.obj.position.set(...item.position);
      item.Helper = new THREE.PointLightHelper(item.obj);
      this.scene.add(item.obj);
    });
  }
  // 相机初始化
  cameraInit () {
    this.camera = new THREE.PerspectiveCamera(
      70, // 摄像机视锥体垂直视野角度
      this.getWidth() / this.getHeight(), // 摄像机视锥体长宽比
      0.01, // 摄像机视锥体近端面
      10000 // 摄像机视锥体远端面
    );
    this.camera.position.set(0, 2, 5);
  }
  // 渲染器初始化
  renderInit () {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // 抗锯齿
      alpha: true, // canvas是否包含alpha
    });
    this.renderer.setSize(this.getWidth(), this.getHeight());
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.dom.appendChild(this.renderer.domElement);
  }
  // 控制器初始化
  controlsInit () {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotateSpeed = 1.0; // 自动旋转速度
    this.controls.autoRotate = this.autoRotate; // 是否自动转动
    // 禁止旋转到底部
    // this.controls.minPolarAngle = (Math.PI*1)/6
    // this.controls.maxPolarAngle = (Math.PI*3)/6
    this.controls.enableDamping = true; // 是否惯性滑动
    this.controls.dampingFactor = 0.2;
    this.controls.rotateSpeed = 0.75; // 手动旋转速度
    this.controlsRotate(this.opt.autoRotate);
    this.controls.update();
  }
  // 控制器旋转
  controlsRotate (autoRotate) {
    this.controls.autoRotate = autoRotate || false;
    if (autoRotate) {
      // 停止操作3s后继续自动转动
      let timer = null;
      this.controls.addEventListener("start", () => {
        if (timer) {
          clearTimeout(timer);
        }
        this.controls.autoRotate = false;
      });
      this.controls.addEventListener("end", () => {
        timer = setTimeout(() => {
          this.controls.autoRotate = true;
          this.controls.update();
        }, 3000);
      });
    }
  }
  // 动画渲染
  animate () {
    requestAnimationFrame(() => {
      this.animate();
    });

    if (this.pointLight) {
      const vector = this.camera.position.clone();
      this.pointLight.position.set(vector.x, vector.y, vector.z);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  // 加载场景
  loadScene (url) {
    if (/\.hdr$/i.test(url)) {
      new RGBELoader().load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = texture;
        this.scene.environment = texture;
      });
    } else if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(url)) {
      new THREE.TextureLoader().load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.scene.background = texture;
        this.scene.environment = texture;
      });
    }
  }
  // 加载模型
  loadModel (url) {
    const loadTip = this.addLoadTip();
    if (/\.gltf$/i.test(url)) {
      // GLTF模型加载
      new GLTFLoader().load(
        url,
        (gltf) => {
          loadTip.textContent = "加载完成！";
          if (this.model) {
            this.scene.remove(this.model);
          }
          let model = gltf.scene;
          this.adjustModel(model);
          this.model = model;
          this.scene.add(this.model);

          setTimeout(() => {
            loadTip.style.display = "none";
          }, 1000);
        },
        (xhr) => {
          // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          //加载进度
          loadTip.textContent = parseInt((xhr.loaded / xhr.total) * 100) + "%加载中...";
        },
        (error) => {
          loadTip.textContent = "模型加载失败！";
          console.error("模型加载失败:", error);
        }
      );
    } else if (/\.obj$/i.test(url)) {
      // OBJ模型加载
      new OBJLoader().load(
        url,
        (obj) => {
          loadTip.textContent = "加载完成！";
          if (this.model) {
            this.scene.remove(this.model);
          }
          this.adjustModel(obj);
          this.model = obj;
          this.scene.add(this.model);

          setTimeout(() => {
            loadTip.style.display = "none";
          }, 1000);
        },
        (xhr) => {
          // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          //加载进度
          loadTip.textContent = parseInt((xhr.loaded / xhr.total) * 100) + "%加载中...";
        },
        (error) => {
          console.error("模型加载失败:", error);
          loadTip.textContent = "模型加载失败！";
        }
      );
    } else if (/\.fbx$/i.test(url)) {
      // FBX模型加载
      new FBXLoader().load(
        url,
        (obj) => {
          loadTip.textContent = "加载完成！";
          if (this.model) {
            this.scene.remove(this.model);
          }
          this.adjustModel(obj);
          this.model = obj;
          this.scene.add(this.model);

          setTimeout(() => {
            loadTip.style.display = "none";
          }, 1000);
        },
        (xhr) => {
          // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
          //加载进度
          loadTip.textContent = parseInt((xhr.loaded / xhr.total) * 100) + "%加载中...";
        },
        (error) => {
          console.error("模型加载失败:", error);
          loadTip.textContent = "模型加载失败！";
        }
      );
    }
  }
  // 根据模型调整相机position
  adjustModel (model) {
    // model.updateMatrixWorld();
    let box3 = new THREE.Box3().setFromObject(model);
    let vector3 = new THREE.Vector3();
    box3.getSize(vector3);
    // console.log(vector3);
    model.position.y = -(vector3.y / 4);
    let distance = (vector3.x + vector3.y + vector3.z) / 3;
    this.camera.position.set(0, 0, distance);
    this.camera.updateProjectionMatrix();
    this.setScaleToFitSize(model);
    this.ModelAutoCenter(model);
  }
  // 响应窗口大小
  onWindowResize () {
    this.camera.aspect = this.getWidth() / this.getHeight();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.getWidth(), this.getHeight());
  }
  // 获取宽度
  getWidth () {
    return this.opt.isFullBrowser ? window.innerWidth : this.dom.offsetWidth;
  }
  // 获取高度
  getHeight () {
    return this.opt.isFullBrowser ? window.innerHeight : this.dom.offsetHeight;
  }
  /**
   * 设置加载模型居中
   * {Object} group 模型对象
   */
  ModelAutoCenter (group) {
    /**
     * 包围盒全自动计算：模型整体居中
     */
    var box3 = new THREE.Box3();
    // 计算层级模型group的包围盒
    // 模型group是加载一个三维模型返回的对象，包含多个网格模型
    box3.expandByObject(group);
    // 计算一个层级模型对应包围盒的几何体中心在世界坐标中的位置
    var center = new THREE.Vector3();
    box3.getCenter(center);
    // console.log('查看几何体中心坐标', center);

    // 重新设置模型的位置，使之居中。
    group.position.x = group.position.x - center.x;
    group.position.y = group.position.y - center.y;
    group.position.z = group.position.z - center.z;
  }
  //获取模型适合观察的缩放的比例
  getFitScaleValue (obj) {
    var boxHelper = new THREE.BoxHelper(obj);
    boxHelper.geometry.computeBoundingBox();
    var box = boxHelper.geometry.boundingBox;
    var maxDiameter = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
    console.log(this.camera.position.z / maxDiameter, "this.Camera.position.z / maxDiameter");
    return this.camera.position.z / maxDiameter;
  }
  //设置模型到适合观察的大小
  setScaleToFitSize (obj) {
    var scaleValue = this.getFitScaleValue(obj) * 0.5;
    // var scaleValue = this.getFitScaleValue(obj);
    obj.scale.set(scaleValue, scaleValue, scaleValue);
    return scaleValue;
  }
  //添加加载进度
  addLoadTip () {
    const element = document.querySelector("body");
    document.querySelector(".loadTip") && element.removeChild(document.querySelector(".loadTip"));
    let loadTip = document.createElement("div");
    loadTip.className = "loadTip";
    loadTip.style.cssText +=
      "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:5px;background-color:rgba(0,0,0,0.5);padding:5px 10px;color:#fff;";
    element.appendChild(loadTip);
    return loadTip;
  }
}
