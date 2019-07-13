<template>
  <servue>
    <template slot="content">
      <b-container>
        <b-form>
          <b-form-group id="username" label="Username" label-for="username">
            <b-form-input id="username" v-model="username" required placeholder="Username"></b-form-input>
          </b-form-group>
          <b-form-group id="password" label="password" label-for="password">
            <b-form-input type="password" id="password" v-model="password" required placeholder></b-form-input>
          </b-form-group>
          <b-button @click="submit">Login</b-button>
        </b-form>
      </b-container>
    </template>
  </servue>
</template>

<script>
import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
import axios from "axios";
export default {
  data() {
    return {
      username: "",
      password: ""
    };
  },
  methods: {
    submit() {
      axios
        .post("/auth", { username: this.username, password: this.password })
        .then(() => console.log("authed"))
        .catch(e => console.log(e));
    }
  }
};
</script>

<style>
</style>
