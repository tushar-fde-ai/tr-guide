import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle, XCircle, AlertCircle, Send, TrendingUp, Sparkles, ChevronDown, Copy, Check, ArrowUp } from 'lucide-react';

const AudienceAgentHandbook = () => {
  const [language, setLanguage] = useState('en');
  const [quizPrompt, setQuizPrompt] = useState('');
  const [quizResult, setQuizResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedPrompts, setCopiedPrompts] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      // Detect active section
      const sections = ['intro', 'section1', 'section2', 'section3', 'section4', 'section5', 'section6', 'quickref', 'quiz'];
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    handleScroll(); // Initial check
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const analyzePrompt = (prompt) => {
    setIsAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      let score = 50;
      let feedback = [];
      let positives = [];
      let warnings = [];
      let complexityFlags = {};

      const lowerPrompt = prompt.toLowerCase();
      const charCount = prompt.length;

      // ============================================
      // COMPLEXITY DETECTION - Check for overly complex prompts
      // ============================================

      // Character limit thresholds
      const CHAR_LIMIT_WARNING = 500;
      const CHAR_LIMIT_ERROR = 1500;

      // Detect section headers (SECTION 0, SECTION 1, etc.)
      const sectionMatches = prompt.match(/SECTION\s*\d+|SECTION\s*[A-Z]+\s*[–-]/gi) || [];
      const sectionCount = sectionMatches.length;

      // Detect execution rules and meta-instructions
      const executionRulePatterns = /EXECUTION RULES|APPROVAL GATE|DO NOT BEGIN|STOP HERE|BEFORE PERFORMING|ASK FOR APPROVAL/gi;
      const executionRuleMatches = prompt.match(executionRulePatterns) || [];
      const hasExecutionRules = executionRuleMatches.length > 0;

      // Detect multiple definitions/logic blocks
      const definitionPatterns = /DEFINITION|DEFINE:|LOGIC|COHORT|SEGMENT DEFINITION|DATASET/gi;
      const definitionMatches = prompt.match(definitionPatterns) || [];
      const definitionCount = definitionMatches.length;

      // Detect segment rules - numbered items, criteria, conditions
      const rulePatterns = /^\s*\d+\.\s+|^\s*[-•]\s+|\(\d+\)|criterion|criteria|condition|rule|filter|include only|exclude/gim;
      const ruleMatches = prompt.match(rulePatterns) || [];
      const ruleCount = ruleMatches.length;

      // Detect multiple objectives
      const objectivePatterns = /OBJECTIVE|ANALYSIS REQUIREMENTS|OUTPUT|ANALYSIS MODULE|REQUIREMENTS/gi;
      const objectiveMatches = prompt.match(objectivePatterns) || [];
      const objectiveCount = objectiveMatches.length;

      // Calculate complexity score
      let complexityScore = 0;
      complexityScore += sectionCount * 15;
      complexityScore += hasExecutionRules ? 25 : 0;
      complexityScore += definitionCount * 8;
      complexityScore += Math.max(0, ruleCount - 3) * 5;
      complexityScore += Math.max(0, objectiveCount - 1) * 10;
      complexityScore += charCount > CHAR_LIMIT_ERROR ? 30 : (charCount > CHAR_LIMIT_WARNING ? 15 : 0);

      // Determine if prompt is too complex
      const isTooComplex = complexityScore >= 40 || sectionCount >= 2 || hasExecutionRules;

      // Calculate suggested sub-prompts
      let suggestedSubPrompts = 1;
      if (sectionCount >= 2) {
        suggestedSubPrompts = Math.max(suggestedSubPrompts, sectionCount);
      }
      if (definitionCount >= 3) {
        suggestedSubPrompts = Math.max(suggestedSubPrompts, Math.ceil(definitionCount / 2));
      }
      if (objectiveCount >= 2) {
        suggestedSubPrompts = Math.max(suggestedSubPrompts, objectiveCount);
      }
      if (ruleCount > 6) {
        suggestedSubPrompts = Math.max(suggestedSubPrompts, Math.ceil(ruleCount / 3));
      }

      // Store complexity flags
      complexityFlags = {
        charCount,
        charLimitWarning: CHAR_LIMIT_WARNING,
        charLimitError: CHAR_LIMIT_ERROR,
        sectionCount,
        ruleCount,
        definitionCount,
        objectiveCount,
        hasExecutionRules,
        isTooComplex,
        suggestedSubPrompts,
        complexityScore
      };

      // ============================================
      // COMPLEXITY WARNINGS & SCORE PENALTIES
      // ============================================

      if (isTooComplex) {
        score = 0; // Reject the prompt entirely
        warnings.push({
          type: 'error',
          title: language === 'en' ? 'Prompt Too Complex' : 'Prompt demasiado complejo',
          message: language === 'en'
            ? 'This prompt contains too many sections, rules, or meta-instructions. The Audience Agent works best with focused, single-objective prompts.'
            : 'Este prompt contiene demasiadas secciones, reglas o meta-instrucciones. El Agente de Audiencias funciona mejor con prompts enfocados de un solo objetivo.'
        });
      }

      // Character limit warnings
      if (charCount > CHAR_LIMIT_ERROR) {
        score -= 30;
        warnings.push({
          type: 'error',
          title: language === 'en'
            ? `Character Limit Exceeded (${charCount.toLocaleString()} / ${CHAR_LIMIT_ERROR} max)`
            : `Límite de caracteres excedido (${charCount.toLocaleString()} / máximo ${CHAR_LIMIT_ERROR})`,
          message: language === 'en'
            ? 'Your prompt is far too long. Break it into smaller, focused requests.'
            : 'Tu prompt es demasiado largo. Divídelo en solicitudes más pequeñas y enfocadas.'
        });
      } else if (charCount > CHAR_LIMIT_WARNING) {
        score -= 15;
        warnings.push({
          type: 'warning',
          title: language === 'en'
            ? `Prompt Length Warning (${charCount.toLocaleString()} / ${CHAR_LIMIT_WARNING} recommended)`
            : `Advertencia de longitud (${charCount.toLocaleString()} / ${CHAR_LIMIT_WARNING} recomendado)`,
          message: language === 'en'
            ? 'Consider simplifying your prompt for better results.'
            : 'Considera simplificar tu prompt para mejores resultados.'
        });
      }

      // Section count warnings
      if (sectionCount >= 2) {
        warnings.push({
          type: 'error',
          title: language === 'en' ? `Multiple Sections Detected (${sectionCount})` : `Múltiples secciones detectadas (${sectionCount})`,
          message: language === 'en'
            ? 'Split each section into a separate prompt for better results.'
            : 'Divide cada sección en un prompt separado para mejores resultados.'
        });
      }

      // ============================================
      // POSITIVE INDICATORS
      // ============================================

      if (lowerPrompt.includes('create') || lowerPrompt.includes('segment') || lowerPrompt.includes('analyze')) {
        score += 10;
        positives.push(language === 'en' ? 'Clear objective stated' : 'Objetivo claro establecido');
      }

      if (lowerPrompt.match(/\d+\s*(days?|weeks?|months?|años?|días?|meses?|semanas?)/)) {
        score += 10;
        positives.push(language === 'en' ? 'Specific timeframe included' : 'Marco temporal específico incluido');
      }

      if (lowerPrompt.match(/\$\d+|>\s*\d+|<\s*\d+|between\s+\d+/)) {
        score += 10;
        positives.push(language === 'en' ? 'Quantitative criteria specified' : 'Criterios cuantitativos especificados');
      }

      if ((lowerPrompt.match(/and|y/g) || []).length >= 2) {
        score += 10;
        positives.push(language === 'en' ? 'Multiple conditions defined' : 'Múltiples condiciones definidas');
      }

      if (lowerPrompt.match(/product|producto|westlaw|practical law|checkpoint|legal|tax|compliance|subscription|license/i)) {
        score += 5;
        positives.push(language === 'en' ? 'Specific products mentioned' : 'Productos específicos mencionados');
      }

      if (lowerPrompt.includes('email') || lowerPrompt.includes('correo') || lowerPrompt.includes('gmail') || lowerPrompt.includes('city') || lowerPrompt.includes('ciudad')) {
        score += 5;
        positives.push(language === 'en' ? 'Relevant data fields identified' : 'Campos de datos relevantes identificados');
      }

      // ============================================
      // NEGATIVE INDICATORS
      // ============================================

      if (lowerPrompt.match(/maybe|perhaps|might|tal vez|quizás|posiblemente/)) {
        score -= 10;
        feedback.push(language === 'en' ? 'Remove uncertain language (maybe, perhaps)' : 'Eliminar lenguaje incierto (tal vez, quizás)');
      }

      if (lowerPrompt.match(/good|better|best|mejores?|buenos?/)) {
        score -= 10;
        feedback.push(language === 'en' ? 'Avoid vague qualifiers - be specific' : 'Evitar calificadores vagos - ser específico');
      }

      if (!lowerPrompt.match(/create|analyze|show|find|crea|analiza|muestra|encuentra/)) {
        score -= 15;
        feedback.push(language === 'en' ? 'Start with a clear action verb' : 'Comenzar con un verbo de acción claro');
      }

      if (prompt.length < 20) {
        score -= 15;
        feedback.push(language === 'en' ? 'Prompt is too short - add more detail' : 'Prompt muy corto - agregar más detalle');
      }

      // Cap score between 0 and 100
      score = Math.max(0, Math.min(100, score));

      let rating = 'Poor';
      let color = 'red';

      if (score >= 80) {
        rating = language === 'en' ? 'Excellent' : 'Excelente';
        color = 'green';
      } else if (score >= 60) {
        rating = language === 'en' ? 'Good' : 'Bueno';
        color = 'blue';
      } else if (score >= 40) {
        rating = language === 'en' ? 'Fair' : 'Regular';
        color = 'yellow';
      } else {
        rating = language === 'en' ? 'Needs Improvement' : 'Necesita Mejora';
        color = 'red';
      }

      setQuizResult({
        score,
        rating,
        color,
        feedback,
        positives,
        warnings,
        complexityFlags
      });
      setIsAnalyzing(false);
    }, 1000);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const copyPrompt = (promptId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompts(prev => ({ ...prev, [promptId]: true }));
    setTimeout(() => {
      setCopiedPrompts(prev => ({ ...prev, [promptId]: false }));
    }, 2000);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 100;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  const content = {
    en: {
      title: "Audience Agent Prompting Guide",
      subtitle: "Best Practices for Segment Creation & Analysis",
      toggle: "Español",
      toc: {
        title: "Table of Contents",
        items: [
          { id: 'intro', label: 'Introduction' },
          { id: 'section1', label: '1. Start Small' },
          { id: 'section2', label: '2. Add Rules' },
          { id: 'section3', label: '3. Complex Rules' },
          { id: 'section4', label: '4. Text Matching' },
          { id: 'section5', label: '5. Insights' },
          { id: 'section6', label: '6. Prompt Limits' },
          { id: 'quickref', label: 'Quick Reference' },
          { id: 'quiz', label: 'Test Your Skills' }
        ]
      },
      sections: {
        intro: {
          title: "Introduction",
          text: "The Audience Agent is a powerful tool for analyzing user data segments and creating new targeted segments. This guide will help you craft effective prompts to maximize its capabilities."
        },
        startSmall: {
          title: "1. Start with Simple Segment Rules",
          description: "Begin with basic, single-condition segments before adding complexity.",
          why: "Why this matters:",
          reasons: [
            "Easier to validate results and understand segment behavior",
            "Faster processing and clearer insights",
            "Provides a solid foundation for iterative refinement"
          ],
          goodExample: {
            title: "Good Prompt Example",
            prompt: "Create a segment of legal professionals who accessed Westlaw in the last 30 days.",
            explanation: "Clear, specific timeframe, single product category, one condition."
          },
          badExample: {
            title: "Avoid This Approach",
            prompt: "Show me everyone who might be interested in legal research or used something recently or visited the website.",
            explanation: "Too vague, multiple unclear conditions, no specific criteria."
          }
        },
        addRules: {
          title: "2. Incrementally Add More Rules",
          description: "Once your basic segment works, layer on additional conditions strategically.",
          approach: "Recommended Approach:",
          steps: [
            "Start with your core defining criteria",
            "Test and verify the initial segment",
            "Add one additional rule at a time",
            "Validate after each addition to track impact"
          ],
          goodExample: {
            title: "Good Progressive Prompt",
            prompt: "Refine the Westlaw subscribers segment to include only users who: (1) logged in within the last 30 days, AND (2) have an annual subscription value over $5000, AND (3) are in law firms with 50+ attorneys.",
            explanation: "Clear progression, numbered conditions, logical AND relationship."
          },
          badExample: {
            title: "Avoid This Approach",
            prompt: "Add more filters to find better subscribers who use more and are valuable.",
            explanation: "No specific criteria, vague qualifiers, unclear what 'better' means."
          }
        },
        complexRules: {
          title: "3. Handling Multiple Conditions (AND/OR Logic)",
          description: "When your segment requires complex logic, structure your prompt clearly.",
          bestPractices: "Best Practices:",
          tips: [
            "Explicitly state AND/OR relationships",
            "Use numbered lists for multiple conditions",
            "Group related conditions with parentheses",
            "Be specific about precedence when mixing AND/OR"
          ],
          goodExample: {
            title: "Good Complex Prompt",
            prompt: "Create a segment where users meet ALL of these criteria:\n1. Subscribed to (Westlaw OR Practical Law OR Checkpoint) in last 60 days\n2. Total annual contract value > $10000\n3. Practice area in (Corporate Law OR Tax OR Litigation)\n4. Firm size between 10-500 attorneys",
            explanation: "Clear structure, explicit AND/OR operators, organized conditions, specific values."
          },
          badExample: {
            title: "Avoid This Approach",
            prompt: "Get users who have Westlaw or maybe Practical Law and pay money and work in major firms or are the right size.",
            explanation: "Ambiguous logic, unclear AND/OR relationships, vague quantities."
          }
        },
        stringMatching: {
          title: "4. Using Text Matching for Filters",
          description: "When filtering by text fields like email, location, or product names, be clear about what you're looking for.",
          guidelines: "Guidelines:",
          rules: [
            "Specify when you want exact matches vs. partial matches",
            "For email filtering, mention the domain or provider you want",
            "For locations, specify if you want cities, states, or regions",
            "When referencing product names, be as specific as possible"
          ],
          goodExample: {
            title: "Good Text Matching Prompt",
            prompt: "Create a segment of users with corporate email domains (not Gmail or Yahoo) who have Westlaw Edge subscriptions and are located in or around New York City.",
            explanation: "Clear intent about email domains, specific product tier, flexible location matching ('in or around'). The agent can interpret 'corporate domains' as excluding consumer email providers."
          },
          badExample: {
            title: "Avoid This Approach",
            prompt: "Find people with emails and who have legal subscriptions in some big cities.",
            explanation: "No specific email criteria, vague product reference ('legal subscriptions'), undefined cities."
          }
        },
        insights: {
          title: "5. Requesting Segment Insights",
          description: "When analyzing existing segments, be specific about what insights you need.",
          tips: "Effective Insight Requests:",
          points: [
            "Specify the metrics you want to analyze",
            "Define comparison groups if needed",
            "Set clear timeframes for analysis",
            "Ask for actionable recommendations"
          ],
          goodExample: {
            title: "Good Insight Prompt",
            prompt: "Analyze the 'Enterprise Legal Subscribers' segment and provide:\n1. Average login frequency in the last 90 days\n2. Most used products within this segment (Westlaw, Practical Law, etc.)\n3. Distribution by firm size and practice area\n4. Renewal rate comparison with overall subscriber base\n5. Recommendations for upsell campaigns",
            explanation: "Specific metrics requested, clear timeframe, structured format, asks for actionable insights."
          },
          badExample: {
            title: "Avoid This Approach",
            prompt: "Tell me about the legal segment and what we should know.",
            explanation: "No specific metrics, no timeframe, too vague, unclear what information is needed."
          }
        },
        promptLimits: {
          title: "6. Prompt Limits & Complexity Guidelines",
          description: "The Audience Agent works best with focused, single-objective prompts. Avoid overly complex prompts that try to accomplish too much at once.",
          limitsTitle: "Recommended Limits",
          limits: [
            { label: "Character Limit", value: "500", max: "1,500", description: "Keep prompts concise. Aim for under 500 characters, never exceed 1,500." },
            { label: "Segment Rules", value: "3-5", max: "6", description: "Limit conditions per prompt. More rules = break into multiple prompts." },
            { label: "Sections", value: "0", max: "1", description: "Avoid multi-section prompts. Each section should be a separate request." },
            { label: "Definitions", value: "1-2", max: "2", description: "Define one concept at a time, then reference in follow-up prompts." }
          ],
          avoidTitle: "What to Avoid",
          avoidItems: [
            { title: "Meta-Instructions", description: "Phrases like 'EXECUTION RULES', 'APPROVAL GATE', 'DO NOT BEGIN', 'STOP HERE' confuse the agent." },
            { title: "Multiple Objectives", description: "Don't combine analysis, segment creation, and reporting in one prompt." },
            { title: "Complex Logical Chains", description: "Deeply nested AND/OR logic with many conditions should be simplified." },
            { title: "Custom Data Definitions", description: "Avoid redefining subscription tiers, renewal logic, or segment definitions inline." }
          ],
          breakdownTitle: "When to Break Down Prompts",
          breakdownDescription: "If your prompt has any of these, consider splitting it:",
          breakdownItems: [
            "Multiple SECTION headers (SECTION 1, SECTION 2, etc.)",
            "More than 5 numbered rules or conditions",
            "Custom definitions for subscriptions, tiers, or cohorts",
            "Multiple analysis objectives or output requirements",
            "Instructions about how to process the prompt itself"
          ],
          exampleTitle: "Example: Breaking Down a Complex Request",
          exampleBad: "SECTION 1: Define subscriber tiers based on usage. SECTION 2: Apply renewal logic. SECTION 3: Analyze churn timing by product.",
          exampleGood: [
            "Prompt 1: \"Create subscriber tiers based on login frequency in the last 6 months: Power Users (daily), Regular (weekly), Occasional (monthly), At-Risk (< monthly).\"",
            "Prompt 2: \"For the subscriber tiers created, identify customers approaching renewal (within 60 days) with declining usage.\"",
            "Prompt 3: \"Analyze churn patterns for each subscriber tier, comparing Westlaw vs Practical Law products.\""
          ]
        },
        quickReference: {
          title: "Quick Reference: Prompt Structure Template",
          template: [
            "State your objective clearly (create segment / analyze segment)",
            "Define core criteria with explicit operators (AND/OR/CONTAINS/EQUALS)",
            "Use numbered lists for multiple conditions",
            "Specify quantitative thresholds precisely",
            "Include timeframes where relevant",
            "For insights: list specific metrics needed"
          ]
        },
        quiz: {
          title: "Test Your Prompt Skills",
          subtitle: "Enter a prompt below and get instant feedback on its quality",
          placeholder: "Example: Create a segment of users who accessed Westlaw in the last 30 days...",
          buttonText: "Analyze Prompt",
          analyzing: "Analyzing...",
          scoreLabel: "Prompt Quality Score",
          strengthsLabel: "Strengths",
          improvementsLabel: "Areas for Improvement",
          noStrengths: "No specific strengths detected. Try including clear objectives, timeframes, and specific criteria.",
          noImprovements: "Great prompt! No major improvements needed.",
          tryAnother: "Try another prompt to practice!"
        }
      },
      footer: "For any support contact Tushar - Forward Deployed Engineering"
    },
    es: {
      title: "Guía de Prompts para el Agente de Audiencias",
      subtitle: "Mejores Prácticas para Creación y Análisis de Segmentos",
      toggle: "English",
      toc: {
        title: "Tabla de Contenidos",
        items: [
          { id: 'intro', label: 'Introducción' },
          { id: 'section1', label: '1. Comenzar Simple' },
          { id: 'section2', label: '2. Agregar Reglas' },
          { id: 'section3', label: '3. Reglas Complejas' },
          { id: 'section4', label: '4. Coincidencia de Texto' },
          { id: 'section5', label: '5. Insights' },
          { id: 'section6', label: '6. Límites de Prompts' },
          { id: 'quickref', label: 'Referencia Rápida' },
          { id: 'quiz', label: 'Prueba tus Habilidades' }
        ]
      },
      sections: {
        intro: {
          title: "Introducción",
          text: "El Agente de Audiencias es una herramienta poderosa para analizar segmentos de datos de usuarios y crear nuevos segmentos específicos. Esta guía te ayudará a crear prompts efectivos para maximizar sus capacidades."
        },
        startSmall: {
          title: "1. Comienza con Reglas de Segmento Simples",
          description: "Comienza con segmentos básicos de una sola condición antes de agregar complejidad.",
          why: "Por qué es importante:",
          reasons: [
            "Más fácil validar resultados y entender el comportamiento del segmento",
            "Procesamiento más rápido y perspectivas más claras",
            "Proporciona una base sólida para refinamiento iterativo"
          ],
          goodExample: {
            title: "Ejemplo de Buen Prompt",
            prompt: "Crea un segmento de profesionales legales que accedieron a Westlaw en los últimos 30 días.",
            explanation: "Claro, marco temporal específico, una categoría de producto, una condición."
          },
          badExample: {
            title: "Evita Este Enfoque",
            prompt: "Muéstrame a todos los que podrían estar interesados en investigación legal o usaron algo recientemente o visitaron el sitio web.",
            explanation: "Demasiado vago, múltiples condiciones poco claras, sin criterios específicos."
          }
        },
        addRules: {
          title: "2. Agrega Reglas Incrementalmente",
          description: "Una vez que tu segmento básico funcione, añade condiciones adicionales estratégicamente.",
          approach: "Enfoque Recomendado:",
          steps: [
            "Comienza con tus criterios fundamentales",
            "Prueba y verifica el segmento inicial",
            "Agrega una regla adicional a la vez",
            "Valida después de cada adición para rastrear el impacto"
          ],
          goodExample: {
            title: "Buen Prompt Progresivo",
            prompt: "Refina el segmento de suscriptores de Westlaw para incluir solo usuarios que: (1) iniciaron sesión en los últimos 30 días, Y (2) tienen un valor de suscripción anual superior a $5000, Y (3) están en firmas de abogados con más de 50 abogados.",
            explanation: "Progresión clara, condiciones numeradas, relación Y lógica."
          },
          badExample: {
            title: "Evita Este Enfoque",
            prompt: "Agrega más filtros para encontrar mejores suscriptores que usen más y sean valiosos.",
            explanation: "Sin criterios específicos, calificadores vagos, no está claro qué significa 'mejores'."
          }
        },
        complexRules: {
          title: "3. Manejo de Múltiples Condiciones (Lógica Y/O)",
          description: "Cuando tu segmento requiere lógica compleja, estructura tu prompt claramente.",
          bestPractices: "Mejores Prácticas:",
          tips: [
            "Declara explícitamente las relaciones Y/O",
            "Usa listas numeradas para múltiples condiciones",
            "Agrupa condiciones relacionadas con paréntesis",
            "Sé específico sobre la precedencia al mezclar Y/O"
          ],
          goodExample: {
            title: "Buen Prompt Complejo",
            prompt: "Crea un segmento donde los usuarios cumplan TODOS estos criterios:\n1. Suscripción a (Westlaw O Practical Law O Checkpoint) en los últimos 60 días\n2. Valor de contrato anual > $10000\n3. Área de práctica en (Derecho Corporativo O Fiscal O Litigios)\n4. Tamaño de firma entre 10-500 abogados",
            explanation: "Estructura clara, operadores Y/O explícitos, condiciones organizadas, valores específicos."
          },
          badExample: {
            title: "Evita Este Enfoque",
            prompt: "Obtén usuarios que tienen Westlaw o tal vez Practical Law y pagan dinero y trabajan en firmas grandes o tienen el tamaño correcto.",
            explanation: "Lógica ambigua, relaciones Y/O poco claras, cantidades vagas."
          }
        },
        stringMatching: {
          title: "4. Uso de Coincidencia de Texto para Filtros",
          description: "Al filtrar por campos de texto como correo, ubicación o nombres de productos, sé claro sobre lo que buscas.",
          guidelines: "Lineamientos:",
          rules: [
            "Especifica cuándo quieres coincidencias exactas vs. parciales",
            "Para filtrado de correo, menciona el dominio o proveedor que deseas",
            "Para ubicaciones, especifica si quieres ciudades, estados o regiones",
            "Al referenciar nombres de productos, sé lo más específico posible"
          ],
          goodExample: {
            title: "Buen Prompt de Coincidencia de Texto",
            prompt: "Crea un segmento de usuarios con dominios de correo corporativo (no Gmail o Yahoo) que tienen suscripciones a Westlaw Edge y están ubicados en Nueva York o sus alrededores.",
            explanation: "Intención clara sobre dominios de correo, nivel de producto específico, coincidencia de ubicación flexible ('en o sus alrededores'). El agente puede interpretar 'dominios corporativos' como excluyendo proveedores de correo de consumo."
          },
          badExample: {
            title: "Evita Este Enfoque",
            prompt: "Encuentra personas con correos y que tienen suscripciones legales en algunas ciudades grandes.",
            explanation: "Sin criterios específicos de correo, referencia vaga de producto ('suscripciones legales'), ciudades indefinidas."
          }
        },
        insights: {
          title: "5. Solicitar Insights de Segmentos",
          description: "Al analizar segmentos existentes, sé específico sobre qué insights necesitas.",
          tips: "Solicitudes Efectivas de Insights:",
          points: [
            "Especifica las métricas que quieres analizar",
            "Define grupos de comparación si es necesario",
            "Establece marcos temporales claros para el análisis",
            "Solicita recomendaciones accionables"
          ],
          goodExample: {
            title: "Buen Prompt de Insight",
            prompt: "Analiza el segmento 'Suscriptores Legales Empresariales' y proporciona:\n1. Frecuencia promedio de inicio de sesión en los últimos 90 días\n2. Productos más utilizados dentro de este segmento (Westlaw, Practical Law, etc.)\n3. Distribución por tamaño de firma y área de práctica\n4. Comparación de tasa de renovación con la base general de suscriptores\n5. Recomendaciones para campañas de venta adicional",
            explanation: "Métricas específicas solicitadas, marco temporal claro, formato estructurado, solicita insights accionables."
          },
          badExample: {
            title: "Evita Este Enfoque",
            prompt: "Dime sobre el segmento legal y qué deberíamos saber.",
            explanation: "Sin métricas específicas, sin marco temporal, demasiado vago, no está claro qué información se necesita."
          }
        },
        promptLimits: {
          title: "6. Límites de Prompts y Guías de Complejidad",
          description: "El Agente de Audiencias funciona mejor con prompts enfocados de un solo objetivo. Evita prompts demasiado complejos que intentan lograr demasiado a la vez.",
          limitsTitle: "Límites Recomendados",
          limits: [
            { label: "Límite de Caracteres", value: "500", max: "1,500", description: "Mantén los prompts concisos. Apunta a menos de 500 caracteres, nunca excedas 1,500." },
            { label: "Reglas de Segmento", value: "3-5", max: "6", description: "Limita las condiciones por prompt. Más reglas = dividir en múltiples prompts." },
            { label: "Secciones", value: "0", max: "1", description: "Evita prompts con múltiples secciones. Cada sección debe ser una solicitud separada." },
            { label: "Definiciones", value: "1-2", max: "2", description: "Define un concepto a la vez, luego referéncialo en prompts de seguimiento." }
          ],
          avoidTitle: "Qué Evitar",
          avoidItems: [
            { title: "Meta-Instrucciones", description: "Frases como 'REGLAS DE EJECUCIÓN', 'PUERTA DE APROBACIÓN', 'NO COMENZAR', 'DETENERSE AQUÍ' confunden al agente." },
            { title: "Múltiples Objetivos", description: "No combines análisis, creación de segmentos e informes en un solo prompt." },
            { title: "Cadenas Lógicas Complejas", description: "Lógica Y/O profundamente anidada con muchas condiciones debe simplificarse." },
            { title: "Definiciones de Datos Personalizadas", description: "Evita redefinir niveles de suscripción, lógica de renovación o definiciones de segmentos en línea." }
          ],
          breakdownTitle: "Cuándo Dividir los Prompts",
          breakdownDescription: "Si tu prompt tiene alguno de estos, considera dividirlo:",
          breakdownItems: [
            "Múltiples encabezados de SECCIÓN (SECCIÓN 1, SECCIÓN 2, etc.)",
            "Más de 5 reglas o condiciones numeradas",
            "Definiciones personalizadas para suscripciones, niveles o cohortes",
            "Múltiples objetivos de análisis o requisitos de salida",
            "Instrucciones sobre cómo procesar el prompt mismo"
          ],
          exampleTitle: "Ejemplo: Dividiendo una Solicitud Compleja",
          exampleBad: "SECCIÓN 1: Definir niveles de suscriptores según uso. SECCIÓN 2: Aplicar lógica de renovación. SECCIÓN 3: Analizar tiempos de abandono por producto.",
          exampleGood: [
            "Prompt 1: \"Crear niveles de suscriptores según frecuencia de inicio de sesión en los últimos 6 meses: Usuarios Intensivos (diario), Regular (semanal), Ocasional (mensual), En Riesgo (< mensual).\"",
            "Prompt 2: \"Para los niveles de suscriptores creados, identificar clientes que se acercan a la renovación (dentro de 60 días) con uso decreciente.\"",
            "Prompt 3: \"Analizar patrones de abandono para cada nivel de suscriptor, comparando productos Westlaw vs Practical Law.\""
          ]
        },
        quickReference: {
          title: "Referencia Rápida: Plantilla de Estructura de Prompt",
          template: [
            "Declara tu objetivo claramente (crear segmento / analizar segmento)",
            "Define criterios centrales con operadores explícitos (Y/O/CONTIENE/IGUAL)",
            "Usa listas numeradas para múltiples condiciones",
            "Especifica umbrales cuantitativos con precisión",
            "Incluye marcos temporales donde sea relevante",
            "Para insights: enumera métricas específicas necesarias"
          ]
        },
        quiz: {
          title: "Prueba Tus Habilidades de Prompts",
          subtitle: "Ingresa un prompt y recibe retroalimentación instantánea sobre su calidad",
          placeholder: "Ejemplo: Crea un segmento de usuarios que accedieron a Westlaw en los últimos 30 días...",
          buttonText: "Analizar Prompt",
          analyzing: "Analizando...",
          scoreLabel: "Puntuación de Calidad del Prompt",
          strengthsLabel: "Fortalezas",
          improvementsLabel: "Áreas de Mejora",
          noStrengths: "No se detectaron fortalezas específicas. Intenta incluir objetivos claros, marcos temporales y criterios específicos.",
          noImprovements: "¡Excelente prompt! No se necesitan mejoras importantes.",
          tryAnother: "¡Prueba otro prompt para practicar!"
        }
      },
      footer: "Para cualquier soporte contacta a Tushar - Forward Deployed Engineering"
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/tr-logo.png"
              alt="Thomson Reuters"
              className="h-12"
            />
            <div className="h-8 w-px bg-slate-300"></div>
            <img
              src="/td-logo.png"
              alt="Treasure Data"
              className="h-10"
            />
            <div className="h-8 w-px bg-slate-300"></div>
            <h1 className="text-xl font-semibold text-slate-900">
              {t.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-slate-600" />
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  language === 'es'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-semibold mb-2">
            {t.subtitle}
          </h2>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Table of Contents Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
              {t.toc.title}
            </h3>
            <nav className="space-y-2">
              {t.toc.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === item.id
                      ? 'bg-emerald-600 text-white font-medium shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">

        {/* Introduction */}
        <section id="intro" className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 hover-lift animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-blue-600" size={28} />
            <h2 className="text-2xl font-semibold text-slate-900">
              {t.sections.intro.title}
            </h2>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {t.sections.intro.text}
          </p>
        </section>

        {/* Section 1: Start Small */}
        <section id="section1" className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 hover-lift animate-fadeIn">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">
            {t.sections.startSmall.title}
          </h2>
          <p className="text-slate-700 mb-4">{t.sections.startSmall.description}</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle size={20} className="text-blue-600" />
              {t.sections.startSmall.why}
            </h3>
            <ul className="space-y-2 ml-7">
              {t.sections.startSmall.reasons.map((reason, idx) => (
                <li key={idx} className="text-slate-700">{reason}</li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h4 className="font-semibold text-green-900">
                  {t.sections.startSmall.goodExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-green-200 relative group">
                <p className="text-sm text-slate-800 font-mono pr-8">
                  "{t.sections.startSmall.goodExample.prompt}"
                </p>
                <button
                  onClick={() => copyPrompt('start-good', t.sections.startSmall.goodExample.prompt)}
                  className="absolute top-2 right-2 p-1.5 rounded hover:bg-green-100 transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy prompt"
                >
                  {copiedPrompts['start-good'] ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-slate-600" />
                  )}
                </button>
              </div>
              <p className="text-sm text-green-800">
                {t.sections.startSmall.goodExample.explanation}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={20} className="text-red-600" />
                <h4 className="font-semibold text-red-900">
                  {t.sections.startSmall.badExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-red-200">
                <p className="text-sm text-slate-800 font-mono">
                  "{t.sections.startSmall.badExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-red-800">
                {t.sections.startSmall.badExample.explanation}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Add Rules */}
        <section id="section2" className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 hover-lift animate-fadeIn">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">
            {t.sections.addRules.title}
          </h2>
          <p className="text-slate-700 mb-4">{t.sections.addRules.description}</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              {t.sections.addRules.approach}
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              {t.sections.addRules.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </span>
                  <p className="text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h4 className="font-semibold text-green-900">
                  {t.sections.addRules.goodExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-green-200">
                <p className="text-sm text-slate-800 font-mono whitespace-pre-line">
                  "{t.sections.addRules.goodExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-green-800">
                {t.sections.addRules.goodExample.explanation}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={20} className="text-red-600" />
                <h4 className="font-semibold text-red-900">
                  {t.sections.addRules.badExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-red-200">
                <p className="text-sm text-slate-800 font-mono">
                  "{t.sections.addRules.badExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-red-800">
                {t.sections.addRules.badExample.explanation}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Complex Rules */}
        <section id="section3" className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 hover-lift animate-fadeIn">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">
            {t.sections.complexRules.title}
          </h2>
          <p className="text-slate-700 mb-4">{t.sections.complexRules.description}</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              {t.sections.complexRules.bestPractices}
            </h3>
            <ul className="space-y-2 bg-slate-50 rounded-lg p-4">
              {t.sections.complexRules.tips.map((tip, idx) => (
                <li key={idx} className="text-slate-700 flex gap-2">
                  <span className="text-slate-900">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h4 className="font-semibold text-green-900">
                  {t.sections.complexRules.goodExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-green-200">
                <p className="text-sm text-slate-800 font-mono whitespace-pre-line">
                  "{t.sections.complexRules.goodExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-green-800">
                {t.sections.complexRules.goodExample.explanation}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={20} className="text-red-600" />
                <h4 className="font-semibold text-red-900">
                  {t.sections.complexRules.badExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-red-200">
                <p className="text-sm text-slate-800 font-mono">
                  "{t.sections.complexRules.badExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-red-800">
                {t.sections.complexRules.badExample.explanation}
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: String Matching */}
        <section id="section4" className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 hover-lift animate-fadeIn">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">
            {t.sections.stringMatching.title}
          </h2>
          <p className="text-slate-700 mb-4">{t.sections.stringMatching.description}</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              {t.sections.stringMatching.guidelines}
            </h3>
            <ul className="space-y-2 bg-slate-50 rounded-lg p-4">
              {t.sections.stringMatching.rules.map((rule, idx) => (
                <li key={idx} className="text-slate-700 flex gap-2">
                  <span className="text-slate-900">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h4 className="font-semibold text-green-900">
                  {t.sections.stringMatching.goodExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-green-200">
                <p className="text-sm text-slate-800 font-mono whitespace-pre-line">
                  "{t.sections.stringMatching.goodExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-green-800">
                {t.sections.stringMatching.goodExample.explanation}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={20} className="text-red-600" />
                <h4 className="font-semibold text-red-900">
                  {t.sections.stringMatching.badExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-red-200">
                <p className="text-sm text-slate-800 font-mono">
                  "{t.sections.stringMatching.badExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-red-800">
                {t.sections.stringMatching.badExample.explanation}
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Insights */}
        <section id="section5" className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 hover-lift animate-fadeIn">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">
            {t.sections.insights.title}
          </h2>
          <p className="text-slate-700 mb-4">{t.sections.insights.description}</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              {t.sections.insights.tips}
            </h3>
            <ul className="space-y-2 bg-slate-50 rounded-lg p-4">
              {t.sections.insights.points.map((point, idx) => (
                <li key={idx} className="text-slate-700 flex gap-2">
                  <span className="text-slate-900">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h4 className="font-semibold text-green-900">
                  {t.sections.insights.goodExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-green-200">
                <p className="text-sm text-slate-800 font-mono whitespace-pre-line">
                  "{t.sections.insights.goodExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-green-800">
                {t.sections.insights.goodExample.explanation}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-5 hover-lift transition-all">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={20} className="text-red-600" />
                <h4 className="font-semibold text-red-900">
                  {t.sections.insights.badExample.title}
                </h4>
              </div>
              <div className="bg-white rounded p-3 mb-3 border border-red-200">
                <p className="text-sm text-slate-800 font-mono">
                  "{t.sections.insights.badExample.prompt}"
                </p>
              </div>
              <p className="text-sm text-red-800">
                {t.sections.insights.badExample.explanation}
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Prompt Limits */}
        <section id="section6" className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 hover-lift animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-orange-600" size={28} />
            <h2 className="text-2xl font-semibold text-slate-900">
              {t.sections.promptLimits.title}
            </h2>
          </div>
          <p className="text-slate-700 mb-6">{t.sections.promptLimits.description}</p>

          {/* Recommended Limits */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-slate-800 mb-4">
              {t.sections.promptLimits.limitsTitle}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {t.sections.promptLimits.limits.map((limit, idx) => (
                <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 mb-1">{limit.label}</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-emerald-600">{limit.value}</span>
                    <span className="text-sm text-slate-500">
                      {language === 'en' ? `(max ${limit.max})` : `(máx ${limit.max})`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{limit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What to Avoid */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
              <XCircle size={20} className="text-red-600" />
              {t.sections.promptLimits.avoidTitle}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {t.sections.promptLimits.avoidItems.map((item, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-red-800">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* When to Break Down Prompts */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              {t.sections.promptLimits.breakdownTitle}
            </h3>
            <p className="text-slate-600 mb-3">{t.sections.promptLimits.breakdownDescription}</p>
            <ul className="space-y-2 bg-orange-50 border border-orange-200 rounded-lg p-4">
              {t.sections.promptLimits.breakdownItems.map((item, idx) => (
                <li key={idx} className="text-orange-800 flex gap-2">
                  <span className="text-orange-600 font-bold">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Example: Breaking Down */}
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">
              {t.sections.promptLimits.exampleTitle}
            </h3>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={18} className="text-red-600" />
                <span className="font-semibold text-red-900">
                  {language === 'en' ? 'Too Complex:' : 'Demasiado Complejo:'}
                </span>
              </div>
              <p className="text-sm text-red-800 font-mono">
                "{t.sections.promptLimits.exampleBad}"
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600" />
                <span className="font-semibold text-green-900">
                  {language === 'en' ? 'Better - Broken into steps:' : 'Mejor - Dividido en pasos:'}
                </span>
              </div>
              <div className="space-y-3">
                {t.sections.promptLimits.exampleGood.map((prompt, idx) => (
                  <div key={idx} className="bg-white rounded p-3 border border-green-200">
                    <p className="text-sm text-green-800 font-mono">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Reference */}
        <section id="quickref" className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-8 text-white hover-lift animate-fadeIn">
          <h2 className="text-2xl font-semibold mb-4">
            {t.sections.quickReference.title}
          </h2>
          <div className="space-y-3">
            {t.sections.quickReference.template.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start animate-slideIn" style={{animationDelay: `${idx * 0.1}s`}}>
                <span className="flex-shrink-0 w-7 h-7 bg-white text-slate-900 rounded-full flex items-center justify-center text-sm font-bold hover:scale-110 transition-transform">
                  {idx + 1}
                </span>
                <p className="text-slate-100 pt-1">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Quiz Section */}
        <section id="quiz" className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-8 text-white hover-lift animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={28} className="animate-bounce-subtle" />
            <h2 className="text-2xl font-semibold">
              {t.sections.quiz.title}
            </h2>
          </div>
          <p className="text-emerald-100 mb-6">
            {t.sections.quiz.subtitle}
          </p>

          <div className="bg-white rounded-lg p-6 shadow-xl">
            <textarea
              value={quizPrompt}
              onChange={(e) => setQuizPrompt(e.target.value)}
              placeholder={t.sections.quiz.placeholder}
              className="w-full h-32 p-4 border-2 border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none transition-all"
            />

            <button
              onClick={() => analyzePrompt(quizPrompt)}
              disabled={!quizPrompt.trim() || isAnalyzing}
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-medium transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t.sections.quiz.analyzing}
                </>
              ) : (
                <>
                  <Send size={20} />
                  {t.sections.quiz.buttonText}
                </>
              )}
            </button>

            {quizResult && (
              <div className="mt-6 space-y-4 animate-fadeIn">
                {/* Critical Warnings (Errors) - Show first */}
                {quizResult.warnings && quizResult.warnings.filter(w => w.type === 'error').length > 0 && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <XCircle size={20} />
                      {language === 'en' ? 'Critical Issues Detected' : 'Problemas Críticos Detectados'}
                    </h4>
                    <ul className="space-y-3">
                      {quizResult.warnings.filter(w => w.type === 'error').map((warning, idx) => (
                        <li key={idx} className="text-red-800">
                          <span className="font-semibold block">{warning.title}</span>
                          <span className="text-sm">{warning.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {quizResult.warnings && quizResult.warnings.filter(w => w.type === 'warning').length > 0 && (
                  <div className="bg-orange-50 border border-orange-300 rounded-lg p-5">
                    <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <AlertCircle size={20} />
                      {language === 'en' ? 'Warnings' : 'Advertencias'}
                    </h4>
                    <ul className="space-y-3">
                      {quizResult.warnings.filter(w => w.type === 'warning').map((warning, idx) => (
                        <li key={idx} className="text-orange-800">
                          <span className="font-semibold block">{warning.title}</span>
                          <span className="text-sm">{warning.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Complexity Metrics */}
                {quizResult.complexityFlags && (
                  <div className="bg-slate-100 border border-slate-300 rounded-lg p-5">
                    <h4 className="font-semibold text-slate-900 mb-3">
                      {language === 'en' ? 'Prompt Analysis' : 'Análisis del Prompt'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {/* Character Count */}
                      <div className={`p-3 rounded-lg ${
                        quizResult.complexityFlags.charCount > quizResult.complexityFlags.charLimitError
                          ? 'bg-red-100 text-red-800'
                          : quizResult.complexityFlags.charCount > quizResult.complexityFlags.charLimitWarning
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        <div className="font-semibold">{language === 'en' ? 'Characters' : 'Caracteres'}</div>
                        <div className="text-lg font-bold">{quizResult.complexityFlags.charCount.toLocaleString()}</div>
                        <div className="text-xs opacity-75">
                          {language === 'en' ? `max ${quizResult.complexityFlags.charLimitError}` : `máx ${quizResult.complexityFlags.charLimitError}`}
                        </div>
                      </div>

                      {/* Rule Count */}
                      <div className={`p-3 rounded-lg ${
                        quizResult.complexityFlags.ruleCount > 6
                          ? 'bg-red-100 text-red-800'
                          : quizResult.complexityFlags.ruleCount > 3
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        <div className="font-semibold">{language === 'en' ? 'Rules' : 'Reglas'}</div>
                        <div className="text-lg font-bold">{quizResult.complexityFlags.ruleCount}</div>
                        <div className="text-xs opacity-75">
                          {language === 'en' ? 'max 5' : 'máx 5'}
                        </div>
                      </div>

                      {/* Section Count */}
                      <div className={`p-3 rounded-lg ${
                        quizResult.complexityFlags.sectionCount >= 2
                          ? 'bg-red-100 text-red-800'
                          : quizResult.complexityFlags.sectionCount === 1
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        <div className="font-semibold">{language === 'en' ? 'Sections' : 'Secciones'}</div>
                        <div className="text-lg font-bold">{quizResult.complexityFlags.sectionCount}</div>
                        <div className="text-xs opacity-75">
                          {language === 'en' ? 'max 0' : 'máx 0'}
                        </div>
                      </div>

                      {/* Definitions */}
                      <div className={`p-3 rounded-lg ${
                        quizResult.complexityFlags.definitionCount >= 3
                          ? 'bg-red-100 text-red-800'
                          : quizResult.complexityFlags.definitionCount >= 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        <div className="font-semibold">{language === 'en' ? 'Definitions' : 'Definiciones'}</div>
                        <div className="text-lg font-bold">{quizResult.complexityFlags.definitionCount}</div>
                        <div className="text-xs opacity-75">
                          {language === 'en' ? 'max 2' : 'máx 2'}
                        </div>
                      </div>
                    </div>

                    {/* Meta-instructions indicator */}
                    {quizResult.complexityFlags.hasExecutionRules && (
                      <div className="mt-3 p-2 bg-red-100 text-red-800 rounded text-sm flex items-center gap-2">
                        <XCircle size={16} />
                        {language === 'en'
                          ? 'Meta-instructions detected (EXECUTION RULES, APPROVAL GATE, etc.)'
                          : 'Meta-instrucciones detectadas (REGLAS DE EJECUCIÓN, etc.)'}
                      </div>
                    )}
                  </div>
                )}

                {/* Score Display */}
                <div className="bg-slate-50 rounded-lg p-6 border-2 border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-700 font-medium">{t.sections.quiz.scoreLabel}</span>
                    <span className={`text-3xl font-bold ${
                      quizResult.color === 'green' ? 'text-green-600' : 
                      quizResult.color === 'blue' ? 'text-blue-600' : 
                      quizResult.color === 'yellow' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {quizResult.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        quizResult.color === 'green' ? 'bg-green-600' : 
                        quizResult.color === 'blue' ? 'bg-blue-600' : 
                        quizResult.color === 'yellow' ? 'bg-yellow-600' : 
                        'bg-red-600'
                      }`}
                      style={{ width: `${quizResult.score}%` }}
                    ></div>
                  </div>
                  <p className={`text-center font-semibold ${
                    quizResult.color === 'green' ? 'text-green-700' : 
                    quizResult.color === 'blue' ? 'text-blue-700' : 
                    quizResult.color === 'yellow' ? 'text-yellow-700' : 
                    'text-red-700'
                  }`}>
                    {quizResult.rating}
                  </p>
                </div>

                {/* Strengths */}
                {quizResult.positives.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5 hover-lift transition-all">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle size={20} />
                      {t.sections.quiz.strengthsLabel}
                    </h4>
                    <ul className="space-y-2">
                      {quizResult.positives.map((positive, idx) => (
                        <li key={idx} className="text-green-800 flex gap-2">
                          <span>✓</span>
                          <span>{positive}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {quizResult.positives.length === 0 && (
                  <div className="bg-slate-100 border border-slate-300 rounded-lg p-5">
                    <p className="text-slate-700">{t.sections.quiz.noStrengths}</p>
                  </div>
                )}

                {/* Improvements */}
                {quizResult.feedback.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                    <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <AlertCircle size={20} />
                      {t.sections.quiz.improvementsLabel}
                    </h4>
                    <ul className="space-y-2">
                      {quizResult.feedback.map((item, idx) => (
                        <li key={idx} className="text-amber-800 flex gap-2">
                          <span>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {quizResult.feedback.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5 hover-lift transition-all">
                    <p className="text-green-800 font-medium">{t.sections.quiz.noImprovements}</p>
                  </div>
                )}

                <p className="text-center text-slate-600 text-sm pt-2">
                  {t.sections.quiz.tryAnother}
                </p>
              </div>
            )}
          </div>
        </section>

        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-3">
            <p className="text-center text-slate-600 text-sm">
              For any support contact{' '}
              <a
                href="mailto:tushar.badhwar@treasure-data.com"
                className="text-emerald-600 hover:text-emerald-700 font-medium underline"
              >
                Tushar
              </a>
              {' '}- Forward Deployed Engineering
            </p>
            <img
              src="/tr-logo.png"
              alt="Thomson Reuters"
              className="h-8"
            />
            <div className="h-6 w-px bg-slate-300"></div>
            <img
              src="/td-logo.png"
              alt="Treasure Data"
              className="h-6"
            />
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 animate-fadeIn z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default AudienceAgentHandbook;