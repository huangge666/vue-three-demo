<template>
  <div class="three">
    <ThreeView class="three-box"
               :modelUrl="modelUrl"
               :lights="lights"
               :sceneBg="BG"
               :autoRotate="autoRotate"
               :style="{filter: (dialogVisible ? `blur(10px)`: ``)}"></ThreeView>
  </div>
</template>

<script>
import * as THREE from "three";
import ThreeView from "@/components/three/three-view.vue";
import BG from "@/assets/images/bg.jpg";
export default {
  name: "",
  components: {
    ThreeView,
  },
  data() {
    return {
      BG,
      baseUrl: "static/models/",
      modelUrl: "static/models/sanxing01.gltf",
      lights: [
        { name: "AmbientLight", obj: new THREE.AmbientLight(0xffffff, 1) },
        // {
        //   type: "DirectionalLight",
        //   position: { x: 80, y: 100, z: 50 },
        //   color: 0xffffff,
        //   intensity: 1,
        // },
      ],
      showTip: true,
      dialogVisible: false,
      autoRotate: false,
    };
  },
  watch: {
    $route: {
      handler: function (val, oldVal) {
        const { baseUrl } = this;
        if (val.query.name) {
          this.modelUrl = `${baseUrl}${val.query.name}`;
        }
      },
      // 深度观察监听
      deep: true,
      immediate: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.three {
  width: 100vw;
  height: 100vh;
  cursor: grab;
  position: relative;
}
</style>
