<template>
    <servue> <!-- REQUIRED --->
      <template slot="content"> <!-- REQUIRED --->
        <div>
        <h1>Hello from plugin!</h1>
        <b-button @click="clicked">Button</b-button>
        </div>
      </template> <!-- REQUIRED --->
    </servue> <!-- REQUIRED --->
</template>

<script>
import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
export default {
  name: "app",
  methods: {
    clicked() {
      console.log("push me..")
    }
  }
};
</script>
