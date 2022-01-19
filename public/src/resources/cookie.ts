import Cookies from "js-cookie";

export function setCookie(cname: string, cvalue: any, expiryDays?: number) {
  var d = new Date();
  d.setTime(d.getTime() + (expiryDays || 1) * 1000 * 60 * 60 * 24);
  var expires = "expires=" + d.toUTCString();
  window.document.cookie = cname + "=" + cvalue + "; " + expires;
}

export function getCookie(cname: string) {
  var name = cname + "=";
  var cArr = window.document.cookie.split(";");
  for (var i = 0; i < cArr.length; i++) {
    var c = cArr[i].trim();
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }
  return "";
}
