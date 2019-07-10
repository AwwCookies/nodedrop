<template>
  <servue>
    <template slot="content">
      <div class="form">
        Username:
        <input type="text" v-model="username" />
        Password:
        <input type="password" v-model="password" />
        <button @click="submit">Login</button>
      </div>
    </template>
  </servue>
</template>

<script>
import axios from "axios"
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
