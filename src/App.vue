<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {};
  },
  methods: {},
  mounted() {},
};
</script>

<style lang="scss">
/*手机*/
@media screen and (max-width: 600px) {
  .el-message {
    min-width: 250px;
  }
}
</style>
