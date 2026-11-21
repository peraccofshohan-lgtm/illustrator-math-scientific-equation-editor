# Features

All counts are read from the built script. Status labels: **Tested** = covered by the automated tests (outside Illustrator); **Not tested in Illustrator** = the Illustrator-side behaviour has not been verified in a real Illustrator.

## Summary

| Feature | Status |
|---|---|
| LaTeX-style parser with line and column errors, serializer, two-way sync | Tested |
| Visual Equation Builder (structures, wrapping, slots, matrix and line operations) | Tested (logic); UI not tested in Illustrator |
| Layout engine (TeX-style boxes, stretchy delimiters, radicals, accents, matrices, multiline) | Tested |
| Live preview drawing and click-to-select | Tested with a ScriptUI mock; appearance not tested in Illustrator |
| Insertion: editable group / components / single text / outlines | Tested with an Illustrator DOM mock; not tested in Illustrator |
| Safety checks (no document, locked or hidden layers), rollback, update in place | Tested with mock; not tested in Illustrator |
| Re-editing via the item note | Tested with mock; not tested in Illustrator |
| Live font-width measurement | Not tested in Illustrator (the fallback approximate metrics are tested) |
| Chemistry: 118 elements, balancing with verification, molar mass | Tested |
| Formatting model, presets, per-element styles, font resolution and fallback | Tested |
| Library persistence (atomic save, backup, recovery), import/export | Tested (real file system behind File/Folder mock) |
| Undo/redo with bounded history | Tested |
| Keyboard shortcuts | Handlers tested; event delivery not tested in Illustrator |
| ES3 compatibility of the release file | Tested (ES3 parser plus a runtime with ES5 built-ins removed) |

## Symbol library — 743 symbols in 30 categories

| Group | Category | Count |
|---|---|---|
| Mathematics | Basic Arithmetic | 38 |
| Mathematics | Greek Lowercase | 30 |
| Mathematics | Greek Uppercase | 24 |
| Mathematics | Algebra | 26 |
| Mathematics | Relations & Inequalities | 22 |
| Mathematics | Calculus | 38 |
| Mathematics | Set Theory | 25 |
| Mathematics | Logic | 27 |
| Mathematics | Geometry | 24 |
| Mathematics | Trigonometry | 28 |
| Mathematics | Linear Algebra | 27 |
| Mathematics | Probability & Statistics | 29 |
| Mathematics | Number Theory & Discrete | 27 |
| Mathematics | Arrows | 21 |
| Mathematics | Brackets & Delimiters | 11 |
| Mathematics | Accents & Decorations | 20 |
| Mathematics | Letterlike & Number Sets | 25 |
| Mathematics | Advanced Mathematics | 41 |
| Physics | Physics: Mechanics | 31 |
| Physics | Physics: Electricity & Magnetism | 28 |
| Physics | Physics: Waves & Optics | 21 |
| Physics | Physics: Thermodynamics | 23 |
| Physics | Physics: Quantum & Modern | 28 |
| Physics | Physics: Constants | 17 |
| Units | Units: SI Base | 7 |
| Units | Units: SI Derived | 22 |
| Units | Units: Other & Compound | 41 |
| Chemistry | Chemistry: Reaction Arrows | 13 |
| Chemistry | Chemistry: States & Signs | 9 |
| Chemistry | Chemistry: Notation | 20 |

Every symbol has a name, Unicode code point, insertion syntax, keywords, and a font-coverage note. Every insertion snippet is verified by the tests to parse, round-trip and lay out.

## Template library — 383 templates in 17 categories

| Group | Category | Count |
|---|---|---|
| Mathematics | Algebra | 38 |
| Mathematics | Calculus | 42 |
| Mathematics | Differential equations | 15 |
| Mathematics | Linear algebra | 21 |
| Mathematics | Trigonometry | 18 |
| Mathematics | Geometry | 22 |
| Mathematics | Statistics and probability | 22 |
| Mathematics | Sets, logic and number theory | 17 |
| Mathematics | Complex numbers | 8 |
| Physics | Mechanics | 37 |
| Physics | Electromagnetism | 27 |
| Physics | Thermodynamics | 16 |
| Physics | Waves and optics | 16 |
| Physics | Modern and quantum physics | 30 |
| Chemistry | Reactions | 22 |
| Chemistry | Equilibrium, kinetics and solutions | 19 |
| Science | Units and constants | 13 |

Templates are stored as structured source (parsed into the shared AST on use), not as plain text. Each one is tested to parse, round-trip, lay out, and insert into the mock document.

### Template index

**Mathematics › Algebra:** Quadratic formula · Quadratic equation · Discriminant · Vieta's formulas (quadratic) · Difference of squares · Square of a sum · Square of a difference · Cube of a sum · Sum of cubes · Difference of cubes · Binomial theorem · Binomial coefficient · Exponent product rule · Exponent quotient rule · Power of a power · Negative exponent · Rational exponent · Logarithm definition · Logarithm product rule · Logarithm quotient rule · Logarithm power rule · Change of base · Arithmetic sequence · Arithmetic series · Geometric sequence · Geometric series · Infinite geometric series · Absolute value definition · Cubic equation · Polynomial (general) · Linear equation (slope-intercept) · Point-slope form · Slope · System of linear equations · Inequality chain · Factorial · Golden ratio · Function composition

**Mathematics › Calculus:** Derivative definition · Derivative (Leibniz) · Second derivative · nth derivative · Partial derivative · Mixed partial derivative · Power rule · Product rule · Quotient rule · Chain rule · Indefinite integral · Definite integral · Fundamental theorem of calculus · Integration by parts · Substitution rule · Gaussian integral · Double integral · Triple integral · Line integral · Contour integral · Surface integral · Limit · Limit at infinity · Sinc limit · L'Hopital's rule · One-sided limits · Taylor series · Maclaurin series of e^x · Maclaurin series of sin x · Maclaurin series of cos x · Geometric power series · Gradient · Divergence · Curl · Laplacian · Divergence theorem · Stokes' theorem · Green's theorem · Arc length · Mean value theorem · Jacobian determinant · Riemann sum

**Mathematics › Differential equations:** First-order linear ODE · Separable ODE · Exponential growth · Logistic equation · Second-order linear ODE · Characteristic equation · Damped harmonic oscillator · Heat equation · Wave equation · Laplace's equation · Poisson's equation · Laplace transform · Fourier transform · Inverse Fourier transform · Fourier series

**Mathematics › Linear algebra:** 2x2 matrix · 3x3 matrix · General m x n matrix · Identity matrix · 2x2 determinant · 3x3 determinant · Inverse of 2x2 matrix · Matrix product entry · Transpose · Eigenvalue equation · Characteristic polynomial · Column vector · Dot product · Cross product · Vector norm · Augmented matrix · Linear system (matrix form) · Cramer's rule · Trace · Orthogonal matrix · Rotation matrix (2D)

**Mathematics › Trigonometry:** Pythagorean identity · Tangent definition · Secant identity · Sine of sum · Cosine of sum · Tangent of sum · Double angle (sine) · Double angle (cosine) · Half angle (sine) · Law of sines · Law of cosines · Euler's formula · Euler's identity · De Moivre's formula · Product to sum · Hyperbolic sine · Hyperbolic cosine · Hyperbolic identity

**Mathematics › Geometry:** Pythagorean theorem · Distance formula · Midpoint formula · Circle equation · Ellipse equation · Hyperbola equation · Parabola · Area of a circle · Circumference · Area of a triangle · Heron's formula · Area of a trapezoid · Volume of a sphere · Surface area of a sphere · Volume of a cylinder · Volume of a cone · Angle sum of a polygon · Arc length (circle) · Sector area · Angle notation · Similar triangles · Parallel and perpendicular

**Mathematics › Statistics and probability:** Mean · Variance (population) · Sample variance · Standard deviation · Z-score · Normal distribution · Binomial distribution · Poisson distribution · Exponential distribution · Expected value · Expected value (continuous) · Variance identity · Covariance · Correlation coefficient · Bayes' theorem · Conditional probability · Addition rule · Permutations · Combinations · Linear regression · Confidence interval · Chi-square statistic

**Mathematics › Sets, logic and number theory:** Set builder notation · Union and intersection · De Morgan's law (sets) · Number sets · For all / exists · Implication · De Morgan's law (logic) · Modular congruence · Fermat's little theorem · Euler's totient · Greatest common divisor · Floor and ceiling · Sum of first n integers · Sum of squares · Basel problem · Riemann zeta function · Harmonic series

**Mathematics › Complex numbers:** Complex number · Modulus · Complex conjugate · Polar form · Imaginary unit · Cauchy integral formula · Cauchy-Riemann equations · Roots of unity

**Physics › Mechanics:** Newton's second law · Newton's second law (momentum) · Momentum · Kinetic energy · Potential energy (gravity) · Work · Work integral · Power · Velocity (kinematics) · Displacement (kinematics) · Velocity squared · Projectile range · Centripetal acceleration · Universal gravitation · Gravitational potential energy · Hooke's law · Spring potential energy · Simple pendulum period · Mass-spring period · Simple harmonic motion · Torque · Angular momentum · Moment of inertia · Rotational kinetic energy · Kepler's third law · Escape velocity · Friction · Impulse · Lagrangian · Euler-Lagrange equation · Hamilton's equations · Bernoulli's equation · Continuity equation (fluid) · Pressure · Hydrostatic pressure · Buoyancy · Density

**Physics › Electromagnetism:** Coulomb's law · Electric field · Electric field of a point charge · Electric potential · Ohm's law · Electrical power · Resistors in series · Resistors in parallel · Capacitance · Parallel-plate capacitor · Energy in a capacitor · RC time constant · Lorentz force · Magnetic force on a wire · Biot-Savart law · Faraday's law · Inductor energy · Gauss's law (differential) · Gauss's law for magnetism · Faraday's law (differential) · Ampere-Maxwell law · Maxwell's equations · Gauss's law (integral) · Speed of light · Poynting vector · Impedance (RLC) · Resonant frequency

**Physics › Thermodynamics:** Ideal gas law · First law of thermodynamics · Entropy (Clausius) · Boltzmann entropy · Heat capacity · Latent heat · Carnot efficiency · Stefan-Boltzmann law · Wien's displacement law · Gibbs free energy · Fourier's law of conduction · Thermal expansion · Average kinetic energy (gas) · RMS speed · Boltzmann distribution · Partition function

**Physics › Waves and optics:** Wave speed · Wave function (traveling) · Angular frequency · Wave number · Doppler effect · Snell's law · Refractive index · Thin lens equation · Magnification · Lensmaker's equation · Double-slit interference · Single-slit minimum · Bragg's law · Malus's law · Sound intensity level · Standing wave frequencies

**Physics › Modern and quantum physics:** Mass-energy equivalence · Relativistic energy · Lorentz factor · Time dilation · Length contraction · Relativistic momentum · Planck relation · Photon momentum · De Broglie wavelength · Photoelectric effect · Heisenberg uncertainty · Energy-time uncertainty · Time-dependent Schrodinger equation · Time-independent Schrodinger equation · Hamiltonian operator · Momentum operator · Canonical commutation · Expectation value · Dirac notation (inner product) · Normalization · Particle in a box · Hydrogen energy levels · Rydberg formula · Quantum harmonic oscillator · Pauli matrices · Radioactive decay · Half-life · Dirac equation · Einstein field equations · Minkowski metric

**Chemistry › Reactions:** Water formation · Methane combustion · Propane combustion · Glucose combustion (respiration) · Photosynthesis · Haber process · Rusting of iron · Neutralization · Precipitation · Limestone decomposition · Zinc and acid · Electrolysis of water · Esterification · Permanganate redox (ionic) · Dichromate half-reaction · Copper half-reaction · Copper sulfate pentahydrate · Carbon-14 decay · Alpha decay of uranium · Ammonium ion · Sulfate ion · Hexacyanoferrate(III)

**Chemistry › Equilibrium, kinetics and solutions:** Equilibrium constant · pH definition · pOH relation · Water autoionization · Acid dissociation · Henderson-Hasselbalch · Rate law · Arrhenius equation · First-order integrated rate law · Molarity · Dilution · Moles · Avogadro's number · Nernst equation · Gibbs and equilibrium · Beer-Lambert law · Raoult's law · Combined gas law · Van der Waals equation

**Science › Units and constants:** Speed of light value · Planck constant · Gravitational constant · Elementary charge · Boltzmann constant · Gas constant · Standard gravity · Vacuum permittivity · Newton (derived unit) · Joule (derived unit) · Scientific notation · Unit conversion · Temperature conversion

## Structures

- **Fractions:** `\frac`, `\dfrac`, `\tfrac`, `\cfrac`, and binomials (`\binom`, `\dbinom`).
- **Roots:** with an optional index.
- **Scripts:** sub/superscripts, prescripts and primes.
- **Big operators:** sum, product, coproduct, unions, intersections, and integrals from single to quadruple, including contour and surface integrals.
- **Functions:** with limits, and `\operatorname`.
- **Stretchy delimiters:** `\left`, `\middle` and `\right`, including invisible delimiters.
- **Matrices:** `matrix`, `pmatrix`, `bmatrix`, `Bmatrix`, `vmatrix`, `Vmatrix`, `smallmatrix`, and `array` with column rules, up to 100×100.
- **Piecewise:** `cases`.
- **Multiline:** `aligned`, `align`, `align*` and `gather`, with tags.
- **Accents:** `\vec`, `\hat`, `\bar`, `\dot`, `\ddot`, `\tilde`, `\widehat`, `\overline`, `\underline`, and the over-arrows (`\overrightarrow`, `\overleftarrow`, `\overleftrightarrow`).
- **Braces and stacking:** over/under braces with labels, `\overset`, `\underset` and `\stackrel`.
- **Arrows:** extensible arrows with labels.
- **Text and style:** `\boxed`, `\text`, colour, and font styles (`\mathbf`, `\mathrm`, `\mathbb`, `\mathcal`, `\mathfrak`, `\mathsf`, `\mathtt`, `\boldsymbol`).
- **Spacing commands.**
- **Units and scientific notation.**
- **Physics notation:** `\dv`, `\pdv`, and bra-ket.
- **Chemistry:** `\ce`.

## Builder operations

56 insertable structures, 29 wrap targets, 8 integral kinds, 5 limit kinds, 10 derivative kinds, matrix row and column insert/delete, environment change, multiline line add/delete/tag, optional-slot toggling, limits placement, element move, duplicate and delete, and per-element style.
