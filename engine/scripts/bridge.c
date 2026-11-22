#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>
#include "swephexp.h"

/* The library sources are unmodified. UTC -> TT/UT1 is delegated to Swiss. */
int main(int argc, char **argv) {
  if (argc != 10) { fprintf(stderr,"invalid arguments"); return 2; }
  swe_set_ephe_path(argv[1]);
  double ms = atof(argv[2]), lat = atof(argv[3]), lon = atof(argv[4]);
  int sid = atoi(argv[5]), node = atoi(argv[6]), n = atoi(argv[7]);
  double step = atof(argv[8]); int houses = atoi(argv[9]);
  if (!isfinite(ms)||!isfinite(lat)||!isfinite(lon)||n<1||n>5000||fabs(lat)>89||fabs(lon)>180) return 2;
  swe_set_sid_mode(sid,0,0);
  char ver[256]; swe_version(ver);
  printf("{\"version\":\"%s\",\"samples\":[",ver);
  int ids[] = {SE_SUN,SE_MOON,SE_MERCURY,SE_VENUS,SE_MARS,SE_JUPITER,SE_SATURN, node ? SE_TRUE_NODE : SE_MEAN_NODE};
  for (int k=0;k<n;k++) {
    double epoch = ms/1000.0 + k*step;
    time_t sec = (time_t)floor(epoch); struct tm t; gmtime_r(&sec,&t);
    double jd[2],x[6],cusps[13],ascmc[10],aya; char err[AS_MAXCH] = {0};
    if (swe_utc_to_jd(t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec+(epoch-floor(epoch)),SE_GREG_CAL,jd,err)<0) {fprintf(stderr,"UTC conversion failed: %s",err);return 3;}
    int flags = SEFLG_SWIEPH | SEFLG_SPEED | SEFLG_SIDEREAL;
    if (swe_get_ayanamsa_ex_ut(jd[1],SEFLG_SWIEPH,&aya,err)<0) return 3;
    if(k)printf(",");
    printf("{\"ms\":%.3f,\"jdUT\":%.12f,\"jdTT\":%.12f,\"ayanamsa\":%.12f,\"asc\":",epoch*1000,jd[1],jd[0],aya);
    if(houses) {
      if(swe_houses_ex(jd[1],SEFLG_SIDEREAL,lat,lon,'W',cusps,ascmc)<0) {fprintf(stderr,"houses failed");return 4;}
      printf("%.12f",ascmc[0]);
    } else printf("null");
    printf(",\"planets\":[");
    for(int i=0;i<8;i++) {
      int ret=swe_calc_ut(jd[1],ids[i],flags,x,err);
      if(ret<0 || (ret & (SEFLG_JPLEPH|SEFLG_SWIEPH|SEFLG_MOSEPH))!=SEFLG_SWIEPH) {fprintf(stderr,"Swiss ephemeris unavailable for body %d: %s",ids[i],err);return 5;}
      if(i)printf(",");
      printf("{\"id\":%d,\"lon\":%.12f,\"speed\":%.12f,\"flags\":%d}",ids[i],x[0],x[3],ret);
    }
    printf("]}");
  }
  printf("]}"); swe_close(); return 0;
}
