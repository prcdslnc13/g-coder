import { describe, it, expect } from "vitest";
import { parseDollarConfig } from "@/lib/settings/parse";
import { lookupSettingDef } from "@/lib/settings/catalog";

// Full $$ dump from a Sienci AltMill (SuperLongBoard EXT, grblHAL).
// Regression: every setting a real machine emits must resolve to a named
// definition for the grblhal flavor — no "Unknown setting" rows.
const ALTMILL_DUMP = `
$0=5.0
$1=255
$2=0
$3=6
$4=0
$5=15
$6=3
$8=0
$9=5
$10=511
$11=0.010
$12=0.002
$13=0
$14=0
$15=0
$16=0
$17=0
$18=0
$19=0
$20=1
$21=1
$22=79
$23=1
$24=150.0
$25=4300.0
$26=25
$27=1.500
$28=0.100
$29=0.0
$30=24000.000
$31=7500.000
$32=0
$33=1000.0
$34=0.0
$35=0.0
$36=100.0
$37=0
$39=1
$40=1
$41=0
$42=2
$43=1
$44=4
$45=3
$46=0
$56=5.0
$57=100.0
$58=-5.0
$59=500.0
$60=1
$61=3
$62=0
$63=3
$64=0
$65=0
$70=11
$100=320.00000
$101=320.00000
$102=200.00000
$103=79.01235
$110=15000.000
$111=15000.000
$112=6000.000
$113=8000.000
$120=1500.000
$121=1500.000
$122=1500.000
$123=1000.000
$130=1260.000
$131=1248.000
$132=170.000
$133=0.000
$160=0.00000
$161=0.00000
$162=0.00000
$163=0.00000
$170=0.000
$171=0.000
$172=0.000
$173=0.000
$300=grblHAL
$301=1
$302=192.168.5.1
$303=192.168.5.1
$304=255.255.255.0
$305=23
$307=80
$308=21
$340=0.0
$341=0
$342=30.0
$343=25.0
$344=200.0
$345=200.0
$346=1
$347=5.0
$348=2.500
$349=25.000
$370=0
$372=0
$374=3
$375=50
$376=1
$384=0
$392=11.0
$393=1.0
$394=11.0
$395=2
$398=128
$476=2
$481=0
$484=0
$485=1
$486=0
$490=
$491=
$492=
$511=0
$512=0
$513=0
$520=0
$534=0
$535=02:08:dc:2b:eb:ec
$536=1
$537=0
$538=0
$539=0.0
$590=1
$591=2
$592=4
$650=0
$673=0.0
$675=0
$676=15
$680=0
$681=0
$683=0
$684=10.00
$685=10.00
$686=50.00
$687=50.00
$700=0
$709=17
$716=0
$730=255.000
$731=0.000
$733=1000.0
$734=0.0
$735=0.0
$736=100.0
$744=15
$745=15
$750=1
$751=4
$752=1
$753=4
$760=0.0
$761=1.0
$762=2.0
$763=3.0
$770=0.000
$771=0.000
$772=0
`;

describe("Sienci AltMill $$ dump coverage", () => {
  it("parses all lines", () => {
    const parsed = parseDollarConfig(ALTMILL_DUMP);
    expect(parsed.length).toBe(ALTMILL_DUMP.trim().split("\n").length);
  });

  it("every setting resolves to a named grblHAL definition", () => {
    const parsed = parseDollarConfig(ALTMILL_DUMP);
    const unknown = parsed
      .filter((p) => lookupSettingDef(p.id, "grblhal") === null)
      .map((p) => p.id);
    expect(unknown).toEqual([]);
  });

  it("every resolved definition has a non-empty name and description", () => {
    const parsed = parseDollarConfig(ALTMILL_DUMP);
    for (const p of parsed) {
      const r = lookupSettingDef(p.id, "grblhal")!;
      expect(r.def.name.length, `$${p.id}`).toBeGreaterThan(0);
      expect(r.def.description.length, `$${p.id}`).toBeGreaterThan(0);
    }
  });
});
