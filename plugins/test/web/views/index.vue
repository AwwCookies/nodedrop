<template>
  <div>
    <servue>
      <template slot="content">
        <h1>Hello from plugin!</h1>
        <b-button>Button</b-button>
      </template>
    </servue>
  </div>
</template>

<script>
import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
export default {
  name: "app"
};
</script>
